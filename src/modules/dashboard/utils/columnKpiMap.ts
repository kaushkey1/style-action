/**
 * Maps table column header labels to their kpi_code in the thresholds API.
 * Columns not listed here get no RAG coloring (null).
 *
 * kpi_code values must match kpi_code in /insights/thresholds (Postgres kpi_thresholds table).
 */
export const HEADER_TO_KPI: Record<string, string> = {
  // Margin / rate metrics
  "Gross Margin": "grossMargin",
  "GM%": "grossMargin",
  "Sell Through": "avgSellThrough",
  "Aged Inv": "agedInventory",
  "Aged%": "agedInventory",
  Fresh: "freshPercent",
  "Fresh%": "freshPercent",
  "Intake Margin %": "intakeMargin",
  // Supply chain
  "Fill Rate": "fillRate",
  "Fill Rate %": "fillRate",
  OTIF: "vendorOtif",
  // Sell-through variants
  "Sellthrough Rate": "avgSellThrough",
  // Store operations
  "Avg SPSF": "salesPerSqft",
  SPSF: "salesPerSqft",
  "Days On Hand": "inventoryDays",
};
