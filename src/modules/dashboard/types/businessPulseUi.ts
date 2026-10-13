/**
 * UI shapes for Business Pulse (charts/tables). Populated from API via mappers — not mock fixtures.
 */

export interface MonthlyRevenuePoint {
  month: string;
  actual: number;
  target: number;
}

export interface CategoryShare {
  name: string;
  value: number;
  color: string;
}

export interface DrilldownRow {
  id: string;
  name: string;
  values: string[];
  children?: DrilldownRow[];
}

export interface SimpleTableConfig {
  title: string;
  headers: string[];
  rows: string[][];
  columnWidthClasses?: string[];
}

export interface SnapshotCardData {
  label: string;
  value: string;
  target: string;
  achievement: number;
  trend: string;
  trendDirection: "up" | "down";
  trendComparison: string;
  status: "on_track" | "warning" | "critical";
}

export interface KpiHealthData {
  total: number;
  onTrack: number;
  warning: number;
  critical: number;
}
