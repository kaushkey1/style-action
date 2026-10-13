/**
 * BigQuery client configuration using Application Default Credentials (ADC)
 *
 * Prerequisites:
 * 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
 * 2. Run: gcloud auth application-default login
 * 3. Set project: gcloud config set project fynd-jio-impetus-prod
 *
 * The ADC will automatically use your local credentials when running locally
 * and service account credentials when deployed.
 */

import { isMockMode } from '@/environment';

// BigQuery configuration
export const BQ_CONFIG = {
  projectId: 'fynd-jio-impetus-prod',
  dataset: 'impetus_planning',
  tables: {
    storePlanogram: 'store_planogram'
  }
};

// BigQuery query interface
export interface BigQueryRequest {
  query: string;
  params?: Record<string, unknown>;
  useLegacySql?: boolean;
}

export interface BigQueryResponse<T = unknown> {
  data: T[];
  totalRows: number;
  schema?: unknown;
}

/**
 * Execute a BigQuery query using ADC
 * This function sends the query to your backend API which handles the actual BigQuery connection
 */
export async function executeBigQuery<T = unknown>(
  request: BigQueryRequest
): Promise<BigQueryResponse<T>> {
  if (isMockMode()) {
    throw new Error('BigQuery is not available in mock mode');
  }

  // The backend API endpoint should handle ADC authentication
  const response = await fetch('/api/bigquery/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: request.query,
      params: request.params,
      useLegacySql: request.useLegacySql || false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`BigQuery query failed: ${error}`);
  }

  return response.json();
}

/**
 * Helper function to format BigQuery table references
 */
export function getTableReference(table: keyof typeof BQ_CONFIG.tables): string {
  return `\`${BQ_CONFIG.projectId}.${BQ_CONFIG.dataset}.${BQ_CONFIG.tables[table]}\``;
}

/**
 * Query builder helper for common planogram queries
 */
export const PlanogramQueries = {
  /**
   * Get all brands with summary statistics
   */
  getAllBrands: () => ({
    query: `
      SELECT
        brand_id,
        brand_id_desc,
        COUNT(DISTINCT site) as total_sites,
        SUM(plan_options) as total_options,
        SUM(plan_qty) as total_quantity,
        MAX(load_time) as last_updated
      FROM ${getTableReference('storePlanogram')}
      WHERE is_active = true
        AND org_id = 'RRLFL'
      GROUP BY brand_id, brand_id_desc
      ORDER BY brand_id_desc
    `,
  }),

  /**
   * Get planogram data for a specific brand
   */
  getBrandPlanogram: (brandId: string) => ({
    query: `
      SELECT
        site,
        brand_id,
        brand_id_desc,
        fashion_grade,
        fashion_grade_description,
        mh_segment_cd,
        mh_segment_desc,
        mh_brick_desc,
        plan_options,
        plan_qty,
        load_time,
        modified_at,
        modified_by
      FROM ${getTableReference('storePlanogram')}
      WHERE brand_id = @brandId
        AND is_active = true
        AND org_id = 'RRLFL'
      ORDER BY site, mh_segment_cd
    `,
    params: { brandId },
  }),

  /**
   * Get planogram summary for a brand
   */
  getBrandSummary: (brandId: string) => ({
    query: `
      WITH brand_data AS (
        SELECT
          site,
          fashion_grade,
          plan_options,
          plan_qty,
          load_time,
          modified_by
        FROM ${getTableReference('storePlanogram')}
        WHERE brand_id = @brandId
          AND is_active = true
          AND org_id = 'RRLFL'
      )
      SELECT
        COUNT(DISTINCT site) as total_sites,
        SUM(plan_options) as total_options,
        SUM(plan_qty) as total_quantity,
        MAX(load_time) as last_updated,
        MAX(modified_by) as last_updated_by,
        COUNTIF(LOWER(fashion_grade) = 'core') as core_count,
        COUNTIF(LOWER(fashion_grade) = 'fashion') as fashion_count,
        COUNTIF(LOWER(fashion_grade) = 'premium') as premium_count,
        COUNT(*) as total_count
      FROM brand_data
    `,
    params: { brandId },
  }),

  /**
   * Get sites for a specific brand
   */
  getBrandSites: (brandId: string) => ({
    query: `
      SELECT DISTINCT
        site,
        SUM(plan_options) as site_options,
        SUM(plan_qty) as site_quantity
      FROM ${getTableReference('storePlanogram')}
      WHERE brand_id = @brandId
        AND is_active = true
        AND org_id = 'RRLFL'
      GROUP BY site
      ORDER BY site
    `,
    params: { brandId },
  }),

  /**
   * Insert or update planogram data
   */
  upsertPlanogram: (data: Record<string, unknown>[]) => ({
    query: `
      MERGE ${getTableReference('storePlanogram')} T
      USING UNNEST(@data) S
      ON T.site = S.site
        AND T.brand_id = S.brand_id
        AND T.mh_segment_cd = S.mh_segment_cd
        AND T.org_id = 'RRLFL'
      WHEN MATCHED THEN
        UPDATE SET
          fashion_grade = S.fashion_grade,
          fashion_grade_description = S.fashion_grade_description,
          mh_segment_desc = S.mh_segment_desc,
          mh_brick_desc = S.mh_brick_desc,
          plan_options = S.plan_options,
          plan_qty = S.plan_qty,
          modified_at = CURRENT_TIMESTAMP(),
          modified_by = S.modified_by,
          version = T.version + 1,
          previous_options = T.plan_options,
          previous_qty = T.plan_qty
      WHEN NOT MATCHED THEN
        INSERT (
          org_id, site, brand_id, brand_id_desc,
          fashion_grade, fashion_grade_description,
          mh_segment_cd, mh_segment_desc, mh_brick_desc,
          plan_options, plan_qty, load_time,
          is_active, uploaded_by, version
        )
        VALUES (
          'RRLFL', S.site, S.brand_id, S.brand_id_desc,
          S.fashion_grade, S.fashion_grade_description,
          S.mh_segment_cd, S.mh_segment_desc, S.mh_brick_desc,
          S.plan_options, S.plan_qty, CURRENT_TIMESTAMP(),
          true, S.uploaded_by, 1
        )
    `,
    params: { data },
  }),
};

/**
 * Error handler for BigQuery operations
 */
export class BigQueryError extends Error {
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'BigQueryError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Validate BigQuery connection using ADC
 */
export async function validateBigQueryConnection(): Promise<boolean> {
  try {
    // Try a simple query to validate connection
    const result = await executeBigQuery({
      query: 'SELECT 1 as test',
    });
    return result.data.length > 0;
  } catch (error) {
    console.error('BigQuery connection validation failed:', error);
    return false;
  }
}