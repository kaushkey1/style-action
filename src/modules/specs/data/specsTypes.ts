/**
 * Specs — GitHub-like versioning system for business SOPs.
 */

export type SpecStatus = 'DRAFT' | 'UNDER_REVIEW' | 'ACTIVE' | 'DEPRECATED';

export interface SpecVersion {
  version: number;
  author: string;
  summary: string;
  created_at: string;
  review_status: 'pending' | 'approved' | 'changes_requested';
  reviewer?: string;
  review_note?: string;
}

export interface SpecSection {
  id: string;
  title: string;
  level: number;
}

export interface Spec {
  id: string;
  title: string;
  domain: string;
  status: SpecStatus;
  current_version: number;
  author: string;
  reviewers: string[];
  linked_skills: string[];
  sections: SpecSection[];
  content: string;
  created_at: string;
  updated_at: string;
  benchmarks?: Record<string, string>;
}

export interface SpecListResponse {
  specs: Spec[];
}

export interface SpecDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export const SPEC_STATUS_CONFIG: Record<SpecStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  DRAFT: { label: 'Draft', variant: 'default' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
  ACTIVE: { label: 'Active', variant: 'success' },
  DEPRECATED: { label: 'Deprecated', variant: 'error' },
};

export const DOMAIN_CONFIG: Record<string, { label: string; variant: 'primary' | 'info' | 'success' | 'warning' | 'purple' | 'default' }> = {
  'revenue-merchandising': { label: 'Revenue & Merch', variant: 'primary' },
  'store-operations': { label: 'Store Ops', variant: 'info' },
  'supply-chain': { label: 'Supply Chain', variant: 'success' },
  'brand-product': { label: 'Brand & Product', variant: 'warning' },
  'finance': { label: 'Finance', variant: 'purple' },
  'default': { label: 'General', variant: 'default' },
};
