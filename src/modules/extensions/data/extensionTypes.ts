// ─── Status Enums ──────────────────────────────────────────────────────────

export type CatalogStatus = 'active' | 'deprecated' | 'disabled';
export type InstanceStatus = 'enabled' | 'disabled' | 'suspended';
export type SubscriptionStatus = 'active' | 'paused';
export type QueryLogStatus = 'pending' | 'running' | 'completed' | 'failed';

// ─── Catalog Extension ─────────────────────────────────────────────────────

export interface CatalogExtension {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  provider: string | null;
  version: string;
  icon_url: string | null;
  iframe_base_url: string | null;
  status: CatalogStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Installed Extension (list item) ────────────────────────────────────────

export interface InstalledExtension {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  iframe_base_url: string | null;
  status: InstanceStatus;
  installed_at: string;
}

// ─── Extension Instance (full detail from GET /{slug}) ──────────────────────

export interface ExtensionInstance {
  id: string;
  extension: CatalogExtension;
  org_id: string;
  tenant_id: string;
  webhook_url: string;
  callback_token?: string;
  status: InstanceStatus;
  config: Record<string, unknown>;
  installed_at: string;
  updated_at: string;
}

// ─── Event Type ─────────────────────────────────────────────────────────────

export interface EventType {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
}

// ─── Subscription ───────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  event_type_id: string;
  status: SubscriptionStatus;
  created_at: string;
}

// ─── Dataset Config ─────────────────────────────────────────────────────────

export interface DatasetConfig {
  id: string;
  name: string;
  bq_project_id: string;
  bq_dataset: string;
  bq_table: string | null;
  query_template: string | null;
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Query Log Entry ────────────────────────────────────────────────────────

export interface QueryLogEntry {
  id: string;
  dataset_config_id: string;
  query_mode: 'structured' | 'sql';
  delivery_mode: 'stream' | 'webhook';
  query_text: string;
  status: QueryLogStatus;
  row_count: number | null;
  bytes_processed: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface PaginatedQueryLogs {
  items: QueryLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Input Types ────────────────────────────────────────────────────────────

export interface RegisterExtensionInput {
  slug: string;
  name: string;
  description?: string;
  provider?: string;
  version?: string;
  icon_url?: string;
  iframe_base_url?: string;
  metadata?: Record<string, unknown>;
}

export interface InstallExtensionInput {
  slug: string;
  webhook_url: string;
  config?: Record<string, unknown>;
}

export interface UpdateExtensionInput {
  webhook_url?: string;
  config?: Record<string, unknown>;
}

export interface CreateDatasetInput {
  name: string;
  bq_project_id: string;
  bq_dataset: string;
  bq_table?: string;
  query_template?: string;
  filters?: Record<string, unknown>;
}

export interface UpdateDatasetInput {
  name?: string;
  bq_table?: string;
  query_template?: string;
  filters?: Record<string, unknown>;
}
