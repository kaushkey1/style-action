import type { SnapshotCardData } from "../types/businessPulseUi";

function isRecord(u: unknown): u is Record<string, unknown> {
  return typeof u === "object" && u !== null && !Array.isArray(u);
}

function readString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "";
}

function readNumber(o: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return 0;
}

function readStatus(o: Record<string, unknown>): SnapshotCardData["status"] {
  const s = readString(o, ["status"]).toLowerCase();
  if (s === "on_track" || s === "warning" || s === "critical") return s;
  if (s === "normal" || s === "on track") return "on_track";
  if (s === "warn") return "warning";
  if (s === "crit") return "critical";
  return "on_track";
}

function readTrendDirection(o: Record<string, unknown>): "up" | "down" {
  const d = readString(o, ["trend_direction", "trendDirection"]).toLowerCase();
  if (d === "up" || d === "down") return d;
  return "up";
}

/**
 * Maps API `revenue_snapshot` items (flexible key casing) to snapshot cards.
 */
export function normalizeRevenueSnapshotItems(raw: unknown[]): SnapshotCardData[] {
  const out: SnapshotCardData[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const label = readString(item, ["label"]);
    const value = readString(item, ["value", "value_formatted"]);
    const target = readString(item, ["target"]);
    if (!label && !value) continue;
    out.push({
      label: label || "—",
      value: value || "—",
      target: target || "",
      achievement: readNumber(item, ["achievement", "ach_pct"]),
      trend: readString(item, ["trend"]),
      trendDirection: readTrendDirection(item),
      trendComparison: readString(item, ["trend_comparison", "trendComparison"]),
      status: readStatus(item),
    });
  }
  return out;
}
