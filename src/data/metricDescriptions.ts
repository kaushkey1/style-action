/**
 * Centralized metric descriptions for info icons on table headers, KPI cards, and mobile cards.
 * Key = exact header string used in table headers / KPI card labels.
 * Each entry has a tooltip (what it means) and formula (how it's calculated).
 * Sourced from docs/specs/ceo-dashboard-metric-tooltips.md
 */

interface MetricDescription {
  tooltip: string;
  formula: string;
  /** Worked example for the Metric Glossary (authored progressively). */
  example?: string;
}

export const METRIC_DESCRIPTIONS: Record<string, MetricDescription> = {
  // ── Business Pulse — Hero KPIs ────────────────────────────────────────
  "Revenue Run Rate": {
    tooltip: "Average daily revenue across all stores",
    formula: "Net Revenue / No. of Billing Days",
  },
  "Gross Margin": {
    tooltip: "Profit retained from each rupee of net revenue after cost of goods",
    formula: "Gross Margin Rs / Net Revenue × 100",
  },
  "Realised GM %": {
    tooltip: "Gross margin percentage actually achieved after markdowns — net of all discount and markdown costs",
    formula: "Realised Gross Margin Rs / Net Revenue × 100",
  },
  "Avg Sell-Through": {
    tooltip: "Percentage of available inventory sold in the period",
    formula: "Qty Sold / (Qty Sold + Stock Qty) × 100",
  },
  "Net Revenue vs Plan": {
    tooltip: "Net revenue performance compared to the planned target",
    formula: "Actual Net Revenue / Planned Net Revenue × 100",
  },

  // ── Business Pulse — Revenue & Margin by Segment ──────────────────────
  Name: {
    tooltip: "Product hierarchy — Segment, Class, or Brick level",
    formula: "MH_SEGMENT > MH_CLASS > MH_BRICK",
  },
  Revenue: {
    tooltip: "Net revenue excluding taxes for this product group",
    formula: "SUM(net_sales_without_tax)",
  },
  "GM%": {
    tooltip: "Gross margin as a percentage of net revenue",
    formula: "Gross Margin Rs / Net Revenue × 100",
  },
  "Sell Through": {
    tooltip: "Share of available inventory that was sold",
    formula: "Qty Sold / (Qty Sold + Stock Qty) × 100",
  },
  "Aged Inv": {
    tooltip: "Stock older than 120 days as a share of total stock",
    formula: "Aged Stock Qty / Total Stock Qty × 100",
  },
  Fresh: {
    tooltip: "Stock less than 45 days old as a share of total stock",
    formula: "Fresh Stock Qty / Total Stock Qty × 100",
  },

  // ── Business Pulse — Fashion Grade ─────────────────────────────────────
  Grade: {
    tooltip: "Fashion grade bucket — Core, Ultimate, or Fashion",
    formula: "fashion_grade_bucket",
  },
  Mix: {
    tooltip: "This grade's share of total revenue",
    formula: "Grade Revenue / Total Revenue × 100",
  },
  Markdown: {
    tooltip: "Price reductions as a share of gross revenue",
    formula: "Total Markdown / Gross Revenue × 100",
  },

  // ── Business Pulse — Format ────────────────────────────────────────────
  Format: {
    tooltip: "Retail store format (Trends, Yousta, Azorte, etc.)",
    formula: "FORMAT_DESC_STD",
  },
  Stores: {
    tooltip: "Number of active stores in this format",
    formula: "COUNT(DISTINCT SITE)",
  },
  "Units Sold": {
    tooltip: "Total items sold across all stores in this format",
    formula: "SUM(total_qty_sold)",
  },

  // ── Financial — Hero KPIs ──────────────────────────────────────────────
  // "Gross Revenue" key removed 2026-06-01 — see "Gross Revenue" entry below; all
  // consumers migrated to use infoKey="Gross Revenue".
  "Intake Margin %": {
    tooltip: "Margin at goods receipt — difference between MRP and cost price",
    formula: "Intake Margin Rs / Net Revenue × 100",
  },
  "Markdown %": {
    tooltip: "Price reductions from original MRP as a share of gross revenue",
    formula: "Total Markdown / Gross Revenue × 100",
  },

  // ── Financial — Margin Flow ────────────────────────────────────────────
  "Intake Margin": {
    tooltip: "Theoretical margin if all products sold at full MRP",
    formula: "SUM(intake_margin_rs)",
  },
  "Markdown Impact": {
    tooltip: "Total discounts and markdowns eroding the intake margin",
    formula: "SUM(total_discount) + SUM(total_markdown)",
  },

  // ── Financial — Key Metrics ────────────────────────────────────────────
  "OTB Consumption": {
    tooltip: "Open-to-Buy budget consumed through committed POs",
    formula: "(Committed + In-Progress POs) / OTB Allocation × 100",
  },
  "Fashion Mix": {
    tooltip: "Share of fashion-grade SKUs in total assortment",
    formula: "Fashion Options / Total Options × 100",
  },
  "Season End GM% Projection": {
    tooltip: "Projected gross margin at season end based on current trajectory",
    formula: "Current GM% + Planned Markdowns + Remaining Inventory",
  },
  "First-Through Velocity": {
    tooltip: "Percentage of new stock sold within 45 days of receipt",
    formula: "Units Sold within 45d of GRN / Total Units Received × 100",
  },

  // ── Inventory Health — Hero KPIs ───────────────────────────────────────
  "Total Inventory Value": {
    tooltip:
      "Total saleable stock value across stores, warehouses, and transit",
    formula: "SUM(m_total_stk_value)",
  },
  "Aged Stock": {
    tooltip:
      "Share of stock older than 120 days — at risk of markdown or write-off",
    formula: "Aged Stock Qty / Total Stock Qty × 100",
  },
  "Aged Stock (>180d)": {
    tooltip:
      "Share of stock older than 120 days — at risk of markdown or write-off",
    formula: "Aged Stock Qty / Total Stock Qty × 100",
  },
  "Aged Stock (>120d)": {
    tooltip:
      "Share of stock older than 120 days — at risk of markdown or write-off",
    formula: "Aged Stock Qty / Total Stock Qty × 100",
  },
  "Inventory Turns": {
    tooltip: "How many times inventory is sold and replaced annually",
    formula: "AVG per site of: (Daily Revenue × 365) / Stock Value",
  },
  "Options Aged >45d": {
    tooltip: "Product options in stock over 45 days with low sell-through",
    formula: "Count where stock age > 45d and sell-through below threshold",
  },

  // ── Inventory Health — Age Distribution ────────────────────────────────
  "0-30 days": {
    tooltip: "Freshest stock — received in the last 30 days",
    formula: "Qty (0-30d) / Total Stock Qty × 100",
  },
  "31-60 days": {
    tooltip: "Stock aged 31-60 days — within prime selling window",
    formula: "Qty (31-60d) / Total Stock Qty × 100",
  },
  "61-90 days": {
    tooltip: "Stock aged 61-90 days — approaching markdown zone",
    formula: "Qty (61-90d) / Total Stock Qty × 100",
  },
  "91-180 days": {
    tooltip: "Stock nearing aged threshold — only core items should be here",
    formula: "Qty (91-180d) / Total Stock Qty × 100",
  },
  ">180 days": {
    tooltip: "Aged stock — high markdown or write-off risk",
    formula: "Qty (>180d) / Total Stock Qty × 100",
  },

  // ── Inventory Health — Tables ──────────────────────────────────────────
  Category: {
    tooltip: "Product segment (Womens Wear, Mens Casual, etc.)",
    formula: "MH_SEGMENT_STD",
  },
  "Stock Value": {
    tooltip: "Total inventory value for this category at latest closing date",
    formula: "SUM(m_total_stk_value)",
  },
  "Days On Hand": {
    tooltip: "Days current stock will last at current daily revenue rate",
    formula: "Stock Qty / Avg Daily Qty Sold",
  },
  Turnover: {
    tooltip: "Number of times inventory is sold and replaced per period",
    formula: "Annual Revenue / Avg Inventory Value",
  },
  "Total Options": {
    tooltip: "Total unique style-color options in this category",
    formula: "COUNT(DISTINCT option_code)",
  },
  "Broken Sets": {
    tooltip: "Options missing one or more key sizes",
    formula: "COUNT(option_code) where broken_pivotal_sizes > 0",
  },
  Broken: {
    tooltip: "Share of options with incomplete size curves",
    formula: "Broken Sets / Total Options × 100",
  },
  "Value At Risk": {
    tooltip: "Stock value of broken set options — effectively unsellable",
    formula: "SUM(stock_value) of broken options",
  },
  "Avg Missing Sizes": {
    tooltip: "Average number of key sizes missing per broken option",
    formula: "AVG(broken_pivotal_sizes)",
  },

  // ── Inventory Health — Key Metrics ─────────────────────────────────────
  "Fresh Inventory": {
    tooltip: "Share of stock less than 45 days old",
    formula: "Fresh Stock Qty / Total Stock Qty × 100",
  },
  "Inventory Days": {
    tooltip: "Days current stock will last at current daily revenue rate",
    formula: "Stock Qty / Avg Daily Qty Sold",
  },
  "NOOS Stockout": {
    tooltip: "Stores where core must-stock items have zero stock",
    formula: "COUNT(DISTINCT SITE) where NOOS items have zero saleable qty",
  },
  "NOOS Stockout (Stores)": {
    tooltip: "Stores where core must-stock items have zero stock",
    formula: "COUNT(DISTINCT SITE) where NOOS items have zero saleable qty",
  },
  "Broken Set Options": {
    tooltip: "Options with incomplete size curves in stores",
    formula: "COUNT(DISTINCT option_code) where pivotal sizes are missing",
  },

  // ── Geography — Hero KPIs ──────────────────────────────────────────────
  "Total Stores": {
    tooltip: "Count of active store locations across all formats",
    formula: "COUNT(DISTINCT SITE)",
  },
  "Avg Revenue/Store": {
    tooltip: "Average daily revenue per store",
    formula: "Total Net Revenue / Store Count",
  },
  "Avg Aged Inventory": {
    tooltip: "Average share of stock older than 180 days across regions",
    formula: "Aged Stock Qty / Total Stock Qty × 100",
  },

  // ── Geography — Tables ─────────────────────────────────────────────────
  Zone: {
    tooltip: "Geographic operating zone (South, West, North, East)",
    formula: "ZONE",
  },
  State: {
    tooltip: "Indian state (KAR, TN, MAH, TG, UP, etc.)",
    formula: "STATE",
  },
  "Rev/Store": {
    tooltip: "Average revenue per store in this zone or region",
    formula: "Revenue / Store Count",
  },
  "Avg SPSF": {
    tooltip: "Sales Per Square Foot — revenue per sq ft of retail space",
    formula: "AVG(spsf)",
  },
  "Avg GMROF": {
    tooltip: "Gross Margin Return on Floor space — profitability per unit area",
    formula: "AVG(gmrof)",
  },
  Conversion: {
    tooltip: "Share of store walk-ins that convert into a billed transaction",
    formula: "No. of Bills / Footfall × 100",
  },
  ABV: {
    tooltip: "Average Bill Value — average gross revenue per transaction (bill)",
    formula: "Gross Revenue / No. of Bills",
  },
  "Avg GM%": {
    tooltip: "Average gross margin percentage across stores in this zone",
    formula: "AVG(gm_pct)",
  },
  "Sell-Through%": {
    tooltip: "Average sell-through rate in this zone",
    formula: "AVG(sell_through_rate)",
  },

  // ── Categories — Hero KPIs ─────────────────────────────────────────────
  "Categories On-Track": {
    tooltip:
      "Categories meeting all 3 thresholds: ST% ≥ 70, Aged ≤ 10%, GM% ≥ 42%",
    formula: "Count where all thresholds pass",
  },
  "Markdown Triggers": {
    tooltip: "Unactioned markdown triggers — options that need price reduction",
    formula: "Count of options meeting markdown criteria but not yet actioned",
  },
  "Top-Up POs Pending": {
    tooltip: "Replenishment POs awaiting release for performing SKUs",
    formula: "Count of pending replenishment POs",
  },

  // ── Categories — Pod Tables ────────────────────────────────────────────
  "Sub-Category": {
    tooltip: "Product class within the segment (Top Wear, Bottom, etc.)",
    formula: "MH_CLASS_STD",
  },
  Brands: {
    tooltip: "Brands selling in this sub-category",
    formula: "STRING_AGG(DISTINCT brand)",
  },

  // ── Operations & Supply Chain — Hero KPIs ──────────────────────────────
  "Vendor OT": {
    tooltip:
      "On-Time delivery rate — percentage of PO qty delivered by expected date",
    formula: "On-Time Delivery Qty / Total PO Qty × 100",
  },
  "Merchandise OT": {
    tooltip:
      "On-Time delivery rate — percentage of PO qty delivered by expected date",
    formula: "On-Time Delivery Qty / Total PO Qty × 100",
  },
  "Vendor OTIF": {
    tooltip:
      "On-Time In-Full delivery rate — qty delivered on time within 5% tolerance",
    formula: "On-Time In-Full Qty / Total PO Qty × 100",
  },
  "Merchandise OTIF": {
    tooltip:
      "On-Time In-Full delivery rate — qty delivered on time within 5% tolerance",
    formula: "On-Time In-Full Qty / Total PO Qty × 100",
  },
  "Vendor OTIF %": {
    tooltip:
      "On-Time In-Full delivery rate — qty delivered on time within 5% tolerance",
    formula: "On-Time In-Full Qty / Total PO Qty × 100",
  },
  OTIF: {
    tooltip:
      "On-Time In-Full delivery rate — qty delivered on time within 5% tolerance",
    formula: "On-Time In-Full Qty / Total PO Qty × 100",
  },
  "OTIF %": {
    tooltip:
      "On-Time In-Full delivery rate — qty delivered on time within 5% tolerance",
    formula: "On-Time In-Full Qty / Total PO Qty × 100",
  },
  "Vendor Fill Rate": {
    tooltip: "Percentage of ordered quantity actually received via GRN",
    formula: "GRN Qty / PO Qty × 100",
  },
  "Fill Rate": {
    tooltip: "Percentage of ordered quantity actually delivered",
    formula: "GRN Qty / PO Qty × 100",
  },
  "Fill Rate %": {
    tooltip: "Percentage of ordered quantity actually delivered",
    formula: "GRN Qty / PO Qty × 100",
  },
  "GRN On-Time": {
    tooltip: "Share of PO qty where GRN was created by expected delivery date",
    formula: "On-Time GRN Qty / Total PO Qty × 100",
  },
  "GRN On-Time %": {
    tooltip: "Share of PO qty where GRN was created by expected delivery date",
    formula: "On-Time GRN Qty / Total PO Qty × 100",
  },
  "GRN On Time %": {
    tooltip: "Share of PO qty where GRN was created by expected delivery date",
    formula: "On-Time GRN Qty / Total PO Qty × 100",
  },
  "Delayed POs": {
    tooltip: "POs past delivery date with no GRN or late GRN",
    formula: "Count where delivery overdue or GRN late",
  },
  "Delayed PO": {
    tooltip: "POs past delivery date with no GRN or late GRN",
    formula: "Count where delivery overdue or GRN late",
  },

  // ── Operations & Supply Chain — Tables ─────────────────────────────────
  "Vendor Code": {
    tooltip: "Unique vendor identifier",
    formula: "vendor_code",
  },
  "Vendor Name": {
    tooltip: "Registered name of the supplier",
    formula: "vendor_name",
  },
  "PO Qty": {
    tooltip: "Total purchase order quantity placed with this vendor",
    formula: "SUM(po_qty)",
  },
  "Lead Time": {
    tooltip: "Average days from PO creation to shipment",
    formula: "AVG(AWB Date - PO Date)",
  },
  "On Time": {
    tooltip:
      "Percentage of orders delivered on or before the committed delivery date",
    formula: "On-Time Qty / Total PO Qty × 100",
  },
  Throughput: {
    tooltip: "Average units processed per day",
    formula: "Total Units / Working Days",
  },
  "Lead Time Bucket": {
    tooltip: "Grouped PO lead time ranges (≤20d, 21-30d, 31-40d, 41-60d, >60d)",
    formula: "CASE on days between PO date and AWB date",
  },
  "PO Count": {
    tooltip: "Number of POs in this lead time range",
    formula: "COUNT(DISTINCT po_number)",
  },
  "Avg Lead Time": {
    tooltip: "Average actual lead time in this bucket",
    formula: "AVG(AWB Date - PO Date)",
  },

  // ── Regional ───────────────────────────────────────────────────────────
  "VM Score": {
    tooltip: "Visual merchandising compliance score for the cluster",
    formula: "Audit score / Max score × 100",
  },
  Planogram: {
    tooltip: "Percentage adherence to the prescribed planogram layout",
    formula: "Compliant fixtures / Total fixtures × 100",
  },
  SOP: {
    tooltip: "Standard operating procedure compliance score",
    formula: "SOP audit score / Max SOP score × 100",
  },
  Score: {
    tooltip: "Overall composite performance score for the store",
    formula: "Weighted avg of VM, Planogram, SOP scores",
  },
  "Rev/Sqft": {
    tooltip: "Revenue generated per square foot of retail space",
    formula: "Net Revenue / Store Area (sqft)",
  },

  // ── Common short labels (used in drill-down KPI cards) ──────────────────
  Volume: {
    tooltip: "Total units sold or planned during the period",
    formula: "SUM(qty_sold)",
  },
  Value: { tooltip: "Total gross revenue value", formula: "SUM(gross_sales)" },
  "Net Revenue": {
    tooltip: "Revenue after returns, discounts, and deductions",
    formula: "SUM(net_sales)",
  },
  "Gross Rev": {
    tooltip: "Net revenue excluding taxes for this product group",
    formula: "SUM(net_sales_without_tax)",
  },
  "Gross Revenue": {
    tooltip: "Total gross revenue after returns and deductions",
    formula: "SUM(gross_sales)",
  },
  "Net Rev": {
    tooltip: "Revenue after returns, discounts, and deductions",
    formula: "SUM(net_sales)",
  },
  Vol: {
    tooltip: "Total units sold or planned during the period",
    formula: "SUM(qty_sold)",
  },
  "Del GM%": {
    tooltip: "Actual gross margin achieved after markdowns and discounts",
    formula: "Delivered Margin Rs / Net Revenue × 100",
  },
  "AOP GM": {
    tooltip: "Annual operating plan gross margin percentage target",
    formula: "AOP Margin Rs / AOP Net Revenue × 100",
  },
  ROS: {
    tooltip: "Rate of Sale — average units sold per store per day",
    formula: "Qty Sold / (Store Count × Days)",
  },
  "Rate of Sale Per Day": {
    tooltip: "Rate of Sale — average units sold per store per day",
    formula: "Qty Sold / (Store Count × Days)",
  },
  "Rate of Sale of Quantity Per Day": {
    tooltip: "Rate of Sale — average units sold per store per day",
    formula: "Qty Sold / (Store Count × Days)",
  },

  // ── AOP ────────────────────────────────────────────────────────────────
  "Volume (Thousands)": {
    tooltip: "Total units planned or sold in thousands",
    formula: "SUM(qty) / 1000",
  },
  ASP: {
    tooltip: "Average selling price per unit",
    formula: "Net Revenue / Qty Sold",
  },
  "Gross Revenue (Lakhs)": {
    tooltip: "Total gross revenue before deductions, in lakhs",
    formula: "SUM(gross_sales) / 100000",
  },
  "Net Revenue (Lakhs)": {
    tooltip: "Revenue after returns, discounts, and deductions, in lakhs",
    formula: "SUM(net_sales) / 100000",
  },
  "Intake GM": {
    tooltip: "Gross margin at the time of initial intake or procurement",
    formula: "Intake Margin Rs / Net Revenue × 100",
  },
  "Delivered GM%": {
    tooltip: "Actual gross margin achieved after markdowns and discounts",
    formula: "Delivered Margin Rs / Net Revenue × 100",
  },
  "Volume (Mn Units)": {
    tooltip: "Total units planned or sold in millions",
    formula: "SUM(qty) / 1000000",
  },
  "Gross Revenue (Cr)": {
    tooltip: "Total gross revenue before deductions, in crores",
    formula: "SUM(gross_sales) / 10000000",
  },
  "Net Revenue (Cr)": {
    tooltip: "Revenue after returns, discounts, and deductions, in crores",
    formula: "SUM(net_sales) / 10000000",
  },
  "AOP GM%": {
    tooltip: "Planned Gross margin as a percentage of net revenue",
    formula: "Planned Gross Margin Rs / Planned Net Revenue × 100",
  },

  // ── AOP Dashboard — Context-specific tooltips ─────────────────────────
  "AOP Volume": {
    tooltip: "Planned Qty during the period",
    formula: "SUM(Planned Qty)",
  },
  "AOP ASP": {
    tooltip: "Average selling price per unit planned",
    formula: "Planned Net Revenue / Planned Qty",
  },
  "AOP Intake GM": {
    tooltip:
      "Planned Gross margin at the time of initial intake or procurement",
    formula: "Planned Intake Margin Rs / Planned Net Revenue × 100",
  },
  "Gross Revenue AOP/Plan": {
    tooltip:
      "Annual AOP plan for gross revenue. Not date-filtered — the plan figure is annual and stays constant across date ranges.",
    formula: "SUM(plan_gross_sales)",
  },
  "Achievement %": {
    tooltip:
      "Actual gross revenue as a percentage of the AOP plan for the filter window.",
    formula: "Actual Gross Revenue / AOP Plan Gross Revenue × 100",
  },
  "AOP Gross Revenue": {
    tooltip: "AOP plan gross revenue per category/sub-category (₹).",
    formula: "SUM(plan_gross_sales)",
  },
  "AOP Net Revenue": {
    tooltip: "AOP plan net revenue per category/sub-category (₹).",
    formula: "SUM(plan_net_sales)",
  },
  "Discount": {
    tooltip:
      "Total discount applied during the period (₹). Distinct from markdown — covers promo + loyalty + everyday discounts.",
    formula: "SUM(total_discount)",
  },

  // ── Variance Tracker — Context-specific tooltips ───────────────────────
  "VT Volume": {
    tooltip: "Planned Vs Actual Sold Qty during the period",
    formula: "SUM(Planned Qty) / SUM(Actual Sold Qty)",
  },
  "VT ASP": {
    tooltip: "Average selling price per unit planned vs Actual",
    formula:
      "(Planned Net Revenue / Planned Qty) / (Actual Net Revenue / Actual Sold Qty)",
  },
  "VT Gross Revenue": {
    tooltip: "Total Planned Vs Actual Gross revenue before deductions",
    formula: "SUM(Planned Gross Revenue) / SUM(Actual Gross Revenue)",
  },
  "VT Net Revenue": {
    tooltip:
      "Planned vs Actual Revenue after returns, discounts, and deductions",
    formula: "SUM(Planned Net Revenue) / SUM(Actual Net Revenue)",
  },
  "VT Intake GM": {
    tooltip:
      "Planned Vs Actual Gross margin at the time of initial intake or procurement",
    formula:
      "(Planned Intake Margin Rs / Planned Net Revenue × 100) / (Actual Intake Margin Rs / Actual Net Revenue × 100)",
  },
  "VT GM%": {
    tooltip: "Planned Vs Actual Gross margin as a percentage of net revenue",
    formula:
      "(Planned Gross Margin Rs / Planned Net Revenue × 100) / (Actual Gross Margin Rs / Actual Net Revenue × 100)",
  },

  // ── AOP Variance ───────────────────────────────────────────────────────
  "Rev Var": {
    tooltip: "Revenue variance — difference between actual and planned revenue",
    formula: "(Actual Revenue - Planned Revenue) / Planned Revenue × 100",
  },
  "GM Var": {
    tooltip: "Gross margin variance — difference between actual and planned GM",
    formula: "(Actual GM% - Planned GM%) in basis points",
  },
  "SPSF Var": {
    tooltip: "Sales per square foot variance from plan",
    formula: "(Actual SPSF - Planned SPSF) / Planned SPSF × 100",
  },
  "Turns Var": {
    tooltip: "Inventory turns variance from plan",
    formula: "(Actual Turns - Planned Turns) / Planned Turns × 100",
  },

  // ── Store Intelligence ────────────────────────────────────────────────
  "Growth YoY": {
    tooltip: "Year-over-year revenue growth percentage for the store",
    formula:
      "(Current Year Revenue - Last Year Revenue) / Last Year Revenue × 100",
  },
  "Fashion %": {
    tooltip: "Percentage of assortment classified as fashion (non-core) styles",
    formula: "Fashion SKU Count / Total SKU Count × 100",
  },
  Affluence: {
    tooltip:
      "Catchment affluence score — purchasing power of the local population",
    formula:
      "Weighted index from income bands, property values, spending patterns (0-100)",
  },
  Youth: {
    tooltip:
      "Youth index — proportion of 18-35 age group in the store's catchment",
    formula:
      "Youth population / Total catchment population × 100 (indexed 0-100)",
  },
  Family: {
    tooltip: "Family index — prevalence of family households in the catchment",
    formula: "Family households / Total households × 100 (indexed 0-100)",
  },
  "Fashion Fwd": {
    tooltip:
      "Fashion forwardness — how receptive the catchment is to new trends",
    formula:
      "Composite of fashion adoption rate, social media engagement, brand awareness (0-100)",
  },
  Destination: {
    tooltip:
      "Destination score — how much the store is a planned shopping destination vs impulse",
    formula:
      "Planned visit rate × basket size × repeat frequency (indexed 0-100)",
  },
  Signal: {
    tooltip:
      "Store performance signal — AI-derived classification of store health",
    formula: "Composite of growth, margin, footfall trends",
  },
  "LFL 2Y CAGR": {
    tooltip: "Like-for-like 2-year compound annual growth rate",
    formula: "((Current Year Rev / 2 Years Ago Rev)^0.5 - 1) × 100",
  },
  Cluster: {
    tooltip:
      "Store cluster assignment based on catchment and performance similarity",
    formula: "K-means clustering on catchment + performance features",
  },

  // ── Store Intelligence — Competition ───────────────────────────────────
  Competitor: {
    tooltip: "Name of the competing retail store or brand",
    formula: "—",
  },
  "Brand/Chain": {
    tooltip: "Parent brand or retail chain the competitor belongs to",
    formula: "—",
  },
  Tier: {
    tooltip:
      "Competitive tier classification based on size, revenue, and brand positioning",
    formula: "Tier 1 (direct), Tier 2 (adjacent), Tier 3 (indirect)",
  },
  Distance: {
    tooltip: "Distance from the store to the competitor in kilometers",
    formula: "Haversine distance from store coordinates",
  },
  Rating: {
    tooltip: "Google Maps rating of the competitor store",
    formula: "Google Places API rating (1-5)",
  },
  "Est. SFT": {
    tooltip: "Estimated square footage of the competitor store",
    formula: "Estimated from satellite imagery + local data",
  },
  Threat: {
    tooltip: "Threat level the competitor poses to this store",
    formula: "Composite of proximity, size, category overlap, rating",
  },
  "Category Strength": {
    tooltip: "Competitor's strength in overlapping product categories",
    formula: "Category overlap × competitor market share",
  },

  // ── Store Intelligence — Demand Tab ────────────────────────────────────
  "Best Period": {
    tooltip:
      "Historical period with the highest revenue for this category at this store",
    formula: "MAX(monthly_revenue) period",
  },
  "Best Rev.": {
    tooltip: "Revenue achieved during the best performing period",
    formula: "MAX(monthly_revenue)",
  },
  "Best Rev": {
    tooltip: "Revenue achieved during the best performing period",
    formula: "MAX(monthly_revenue)",
  },
  "Current Rev.": {
    tooltip: "Revenue for the current reporting period",
    formula: "SUM(current_period_revenue)",
  },
  "Current Rev": {
    tooltip: "Revenue for the current reporting period",
    formula: "SUM(current_period_revenue)",
  },
  "Revenue Index": {
    tooltip:
      "Category demand index relative to network average (100 = average)",
    formula: "Store category revenue / Network avg category revenue × 100",
  },
  "ST 30d": {
    tooltip: "Sell-through rate over the last 30 days",
    formula: "Units Sold (30d) / (Opening Stock + Receipts) × 100",
  },

  // ── Category-WW dashboard additions ─────────────────────────────────────
  // Note: top-level "Category" entry already declared above in the Inventory
  // Health section (line ~181). The P&L Summary table uses that same key.
  "Sub-Class": {
    tooltip: "Sub-category within a class (Kurtas, Tops, Bras, etc.)",
    formula: "MH_SUBCLASS",
  },
  "Markdown Value": {
    tooltip: "Total markdown value taken on this category",
    formula: "SUM(markdown_value)",
  },
  // "Net Revenue" key removed 2026-06-01 — see "Net Revenue" entry above; all
  // consumers migrated to use infoKey="Net Revenue".
  COGS: {
    tooltip: "Cost of goods sold",
    formula: "SUM(intake_cost) for sold units",
  },
  "GM (₹)": {
    tooltip: "Absolute gross margin in rupees",
    formula: "Net Revenue − COGS",
  },
  "Var to Plan": {
    tooltip: "Variance vs planned target (negative = under-performing)",
    formula: "Actual − Planned",
  },
  GMROI: {
    tooltip: "Gross margin return on inventory — profit per rupee of average stock",
    formula: "Gross Margin / Avg Inventory Cost",
  },
  "Option ID": {
    tooltip: "Unique style identifier for a single option",
    formula: "SKU.option_id",
  },
  "Intake Date": {
    tooltip: "Date the option first received stock",
    formula: "MIN(grn_date) per option",
  },
  "ST %": {
    tooltip: "Sell-through — share of available inventory sold",
    formula: "Units Sold / (Units Sold + Stock) × 100",
  },
  "FP ST %": {
    tooltip: "Full-price sell-through (excludes markdown revenue). In the Sub-Category Performance table, this is a per-subcategory aggregate sharing a denominator with Season ST %. May differ from the H2 'Full-Price ST' KPI tile, which is a per-site AVG with FP-only denominator — intentional, different aggregation levels.",
    formula: "Full-Price Units Sold / (Units Sold + Stock) × 100",
  },
  Stage: {
    tooltip: "Markdown stage — Full Price, Stage 1, Stage 2, Stage 3",
    formula: "Lookup from markdown_stage table",
  },
  Trend: {
    tooltip: "Direction of recent movement (↑ improving, ↓ declining, → flat)",
    formula: "Sign of week-over-week change",
  },
  "PO #": {
    tooltip: "Purchase order number",
    formula: "PO.po_number",
  },
  Option: {
    tooltip: "Unique style identifier for a single option",
    formula: "SKU.option_id",
  },
  "Cover %": {
    tooltip: "Cover ratio — current cover vs target weeks of cover",
    formula: "(Stock / Avg Weekly Revenue) / Target Cover Weeks × 100",
  },
  "Top-Up Units": {
    tooltip: "Units recommended for top-up reorder",
    formula: "Target Cover − Current Stock",
  },
  Receive: {
    tooltip: "Whether units have been physically received at DC",
    formula: "GRN status flag",
  },
  Store: {
    tooltip: "Store identifier (mall + location)",
    formula: "Store.name",
  },
  Time: {
    tooltip: "Time elapsed since the trigger fired",
    formula: "now() − trigger_timestamp",
  },
  "MD Action": {
    tooltip: "Whether a markdown action has been taken on this trigger",
    formula: "Yes / No flag from markdown actions table",
  },
  "Broken %": {
    tooltip: "Share of options that are broken-size",
    formula: "Broken / Total Options × 100",
  },
  "At-Risk Revenue": {
    tooltip: "Revenue at risk because broken-size options can't fulfil demand",
    formula: "SUM(lost_revenue_estimate) per broken option",
  },
  "Right-Stocked": {
    tooltip: "Stores within the optimal stock band (not over- or under-stocked)",
    formula: "COUNT(stores WHERE stock_index BETWEEN 0.85 AND 1.15)",
  },
  "Optimally Stocked": {
    tooltip: "Stores within the optimal stock band (not over- or under-stocked)",
    formula: "COUNT(stores WHERE stock_index BETWEEN 0.85 AND 1.15)",
  },
  Overstocked: {
    tooltip: "Stores carrying more stock than the planned cover",
    formula: "COUNT(stores WHERE stock_index > 1.15)",
  },
  Understocked: {
    tooltip: "Stores carrying less stock than the planned cover",
    formula: "COUNT(stores WHERE stock_index < 0.85)",
  },
  "Rev/Day": {
    tooltip: "Average revenue per store per day",
    formula: "Net Revenue / (Stores × Days)",
  },
  "From Store": {
    tooltip: "Source store for the reallocation transfer",
    formula: "Reallocation.source_store",
  },
  "To Store": {
    tooltip: "Destination store for the reallocation transfer",
    formula: "Reallocation.target_store",
  },
  Units: {
    tooltip: "Number of units involved",
    formula: "SUM(units)",
  },
  Reason: {
    tooltip: "Why the reallocation is recommended",
    formula: "System rule label",
  },
  "Est. Uplift": {
    tooltip: "Estimated additional revenue per week from the reallocation",
    formula: "Velocity uplift × Avg Selling Price",
  },
  Budget: {
    tooltip: "Open-to-buy budget allocated for the period",
    formula: "Budget.allocated_value",
  },
  "# POs": {
    tooltip: "Count of purchase orders raised",
    formula: "COUNT(po_id)",
  },
  Committed: {
    tooltip: "Budget committed via approved POs",
    formula: "SUM(po_value WHERE status IN ('approved','open'))",
  },
  Open: {
    tooltip: "Open balance not yet received",
    formula: "Committed − Received",
  },
  "Util %": {
    tooltip: "Percent of budget consumed",
    formula: "Committed / Budget × 100",
  },
  Remaining: {
    tooltip: "Budget remaining after committed POs",
    formula: "Budget − Committed",
  },
  Vendor: {
    tooltip: "Vendor / supplier name",
    formula: "Vendor.name",
  },
  "Order Date": {
    tooltip: "Date the PO was raised",
    formula: "PO.order_date",
  },
  Expected: {
    tooltip: "Expected delivery date per vendor commitment",
    formula: "PO.expected_date",
  },
  Actual: {
    tooltip: "Actual delivery date (or projection if open)",
    formula: "GRN.actual_date or projection",
  },
  Status: {
    tooltip: "Current status of the PO (Dispatched, In Transit, At DC, Overdue)",
    formula: "PO.status",
  },
  Date: {
    tooltip: "Reference date for this row",
    formula: "Row.date",
  },
  "Intake Value": {
    tooltip: "Total value of goods received under this PO",
    formula: "SUM(intake_units × intake_cost)",
  },
  "IM %": {
    tooltip: "Intake margin — margin locked in at the time of intake",
    formula: "(MRP − Intake Cost) / MRP × 100",
  },
  GRN: {
    tooltip: "Goods Receipt Note — confirms physical receipt at DC",
    formula: "Yes / No flag from GRN table",
  },
  Owner: {
    tooltip: "Person accountable for this PO / approval",
    formula: "User.full_name",
  },
  "Stores Carrying WW": {
    tooltip: "Number of stores currently stocking Womens Wear vs total network",
    formula: "Stores w/ WW stock / Total stores",
  },
  "Ajio SLA %": {
    tooltip: "On-time fulfilment SLA for Ajio orders sourced from this category",
    formula: "Orders shipped within SLA / Total orders × 100",
  },
  "Vendor Concentration": {
    tooltip: "Maximum % of intake value from any single vendor — flags concentration risk",
    formula: "MAX(vendor_intake_value) / Total Intake × 100",
  },
  "Sample Approval %": {
    tooltip: "Share of submitted samples approved on first review",
    formula: "Samples approved / Samples submitted × 100",
  },
  "OTB Remaining": {
    tooltip: "Open-to-buy budget remaining for the season",
    formula: "Budget − Committed",
  },
  "Options in MD Stage 3": {
    tooltip: "Count of options at the deepest markdown stage (typically 50%+ off)",
    formula: "COUNT(options WHERE md_stage = 3)",
  },
  "Size Completeness": {
    tooltip: "Share of stores carrying the full size run for active options",
    formula: "Store-options w/ all sizes / Total store-options × 100",
  },
  "LFL Growth %": {
    tooltip: "Like-for-like revenue growth — same stores year-over-year",
    formula: "(LY Revenue − Revenue) / LY Revenue × 100",
  },
  "Chase Consumed": {
    tooltip: "Share of chase budget already used to refill best sellers",
    formula: "Chase Spend / Chase Budget × 100",
  },
  "Markdown Cost as % of Revenue": {
    tooltip: "Markdown cost as a percent of gross revenue",
    formula: "Markdown Value / Gross Revenue × 100",
  },
  "Markdown Volume as % of Revenue": {
    tooltip: "Share of unit revenue sold under markdown",
    formula: "Markdown Units Sold / Total Units Sold × 100",
  },
  "Inv Turns (annualised)": {
    tooltip: "Inventory turns annualised — Net Revenue / Avg Stock × periods",
    formula: "Net Revenue (LTM) / Avg Inventory at Cost",
  },
  "Days on Hand": {
    tooltip: "Stock cover at current revenue pace, in days",
    formula: "Closing Stock / Avg Daily Revenue",
  },

  // ── Sourcing Director ─────────────────────────────────────────────────
  "Vendors at Risk": {
    tooltip: "Vendors with critical performance or compliance failures requiring escalation",
    formula: "Count of vendors with Fill Rate <70% or OTIF <75% or zero GRN",
  },
  "DC Dwell Time": {
    tooltip: "Average hours from warehouse receipt to dispatch — delays cascade to store stockouts",
    formula: "Avg(Dispatch Timestamp − Receipt Timestamp) in hours",
  },
  "GRN Pending": {
    tooltip: "Purchase orders delivered but Goods Receipt Note not yet generated",
    formula: "Count of POs with Delivery = Done AND GRN = Pending",
  },
  "Delivery SLA": {
    tooltip: "Percentage of shipments delivered within the committed SLA window",
    formula: "Shipments Within SLA / Total Shipments × 100",
  },
  "Shipment Exceptions": {
    tooltip: "Active shipment exceptions — address mismatches, damages, lost packages",
    formula: "Count of shipments with Exception Status ≠ Null",
  },
  "Intransit Delays": {
    tooltip: "Shipments delayed beyond expected transit time between hubs",
    formula: "Count where Actual Transit Days > Expected Transit Days",
  },
  "Fabric Utilization": {
    tooltip: "Committed fabric as % of total capacity — approaching 85% triggers alerts",
    formula: "Committed Fabric (m) / Total Fabric (m) × 100",
  },
  "Quality Pass Rate": {
    tooltip: "Units passing quality inspection on first attempt across all vendors",
    formula: "Units Passed / Total Inspected × 100",
  },
  "Audit Compliance": {
    tooltip: "Factory audit pass rate across all active vendor facilities",
    formula: "Factories Passing / Total Audited × 100",
  },
  "Sample Approval": {
    tooltip: "Submitted samples approved by the design/buying team",
    formula: "Approved Samples / Total Submitted × 100",
  },
  "RFID Compliance": {
    tooltip: "POs with correct RFID tagging at source — required for inventory accuracy",
    formula: "POs with Correct RFID / Total POs × 100",
  },
  "Total POs": {
    tooltip: "Total purchase orders created this season across all vendors",
    formula: "Count of POs with Creation Date in current season",
  },
  "First-Pass Yield": {
    tooltip: "Units passing quality inspection on first attempt — measures vendor quality",
    formula: "Units Passed First Inspection / Total Inspected × 100",
  },
  "Defect Rate": {
    tooltip: "Defective units as % of total inspected — target ≤2%",
    formula: "Defective Units / Total Inspected × 100",
  },
  "At-Risk Fabric": {
    tooltip: "Fabric at risk of ageing out before commitment to POs",
    formula: "Sum of fabric with Age > threshold or expiry within 30d",
  },
  "Available Fabric": {
    tooltip: "Fabric metres available to book for new purchase orders",
    formula: "Total Fabric − Committed Fabric (in metres)",
  },
  "Committed Fabric": {
    tooltip: "Fabric metres committed to active purchase orders",
    formula: "Sum of fabric allocated to POs with Status ≠ Cancelled",
  },
  "Active Vendors": {
    tooltip: "Vendors with at least one open PO in the system",
    formula: "Count of distinct vendors with Open PO > 0",
  },
  "Pack-by-Store": {
    tooltip: "POs with correct pack-by-store configuration for direct store delivery",
    formula: "POs with Correct PBS / Total POs × 100",
  },
  "Open POs": {
    tooltip: "Purchase orders in progress — from creation through to GRN",
    formula: "Count of POs with Status IN (Created, Confirmed, Production, QC, Shipped)",
  },
  "In-Transit POs": {
    tooltip: "Purchase orders currently in transit from vendor to warehouse",
    formula: "Count of POs with Status = In Transit",
  },
  "Cost Compliance": {
    tooltip: "Percentage of POs within the negotiated cost range",
    formula: "POs Within Cost Target / Total POs × 100",
  },
  "PO-to-Shelf": {
    tooltip: "Average days from PO creation to store shelf — target ≤30 days",
    formula: "Avg(Store Receipt Date − PO Creation Date) in days",
  },
  "PO-to-GRN": {
    tooltip: "Avg days from PO creation to GRN. Partial metric — covers PO→GRN only. GRN→shelf timing pending.",
    formula: "Avg(GRN Date − PO Creation Date) in days",
  },
  "RFID Accuracy": {
    tooltip: "RFID matched units as % of total scanned units",
    formula: "Matched Units / Total Scanned × 100",
  },
  "Inventory Latency": {
    tooltip: "Gold table refresh latency — time for inventory changes to reflect in analytics",
    formula: "Avg(Analytics Timestamp − Source Update) in seconds",
  },

  // ── Sourcing tables — column-header glossary (D6/D7 additions) ───────
  Quality: {
    tooltip: "Quality pass rate across this vendor's inspected units",
    formula: "Units Passed QC / Total Inspected × 100",
  },
  "Capacity/mo": {
    tooltip: "Vendor's stated monthly production capacity in units",
    formula: "Vendor.monthly_capacity_units",
  },
  "Current Load": {
    tooltip: "Units this vendor is currently producing against open POs",
    formula: "SUM(open_po_units) for vendor",
  },
  "Load %": {
    tooltip: "Current load as a percentage of monthly capacity — over 100% = overcommitted",
    formula: "Current Load / Capacity × 100",
  },
  Delayed: {
    tooltip: "Count of POs from this vendor or cluster past their delivery date",
    formula: "Count where delivery overdue or GRN late",
  },
  "PO Value": {
    tooltip: "Total open purchase-order value with this vendor",
    formula: "SUM(po_value) for open POs",
  },
  "Share %": {
    tooltip: "This vendor's share of total open PO value — flags concentration risk",
    formula: "Vendor PO Value / Total Open PO Value × 100",
  },
  Risk: {
    tooltip: "Concentration risk classification — Critical when share > 20%",
    formula: "Bucket on Share %",
  },
  "IM%": {
    tooltip: "Intake margin — margin locked in at the time of intake",
    formula: "(MRP − Intake Cost) / MRP × 100",
  },
  Target: {
    tooltip: "Planned target value for this metric",
    formula: "Planning system target",
  },
  Compliance: {
    tooltip: "Percentage of POs within the negotiated cost range",
    formula: "POs Within Cost Target / Total POs × 100",
  },
  "POs Below Target": {
    tooltip: "Count of POs failing the intake-margin target",
    formula: "Count where PO IM% < Target",
  },
  "Value at Risk": {
    tooltip: "Open PO value where intake margin is below target",
    formula: "SUM(po_value) where IM% < Target",
  },
  "In Production": {
    tooltip: "POs currently being manufactured at the vendor",
    formula: "Count where PO status = In Production",
  },
  "In Transit": {
    tooltip: "POs en route from vendor to DC",
    formula: "Count where PO status = In Transit",
  },
  Delivered: {
    tooltip: "POs physically delivered to the DC",
    formula: "Count where PO status = Delivered",
  },
  "GRN Done": {
    tooltip: "POs with Goods Receipt Note generated and reconciled",
    formula: "Count where PO status = GRN Generated",
  },
  "Avg Lead": {
    tooltip: "Average days from PO creation to delivery for this category",
    formula: "AVG(Delivery Date − PO Date)",
  },
  "Days Delayed": {
    tooltip: "Days past the committed delivery date this PO is overdue",
    formula: "TODAY − Expected Delivery Date",
  },
  "Stage Stuck": {
    tooltip: "Pipeline stage where this PO has stalled",
    formula: "PO.current_stage",
  },
  Shipments: {
    tooltip: "Total shipments handled by this delivery partner",
    formula: "Count of shipments dispatched via partner",
  },
  "SLA Met": {
    tooltip: "Percentage of shipments delivered within the committed SLA window",
    formula: "Shipments Within SLA / Total Shipments × 100",
  },
  "Avg Days": {
    tooltip: "Average transit time for this partner across all shipments",
    formula: "AVG(Delivery Date − Dispatch Date)",
  },
  "Failed Pickups": {
    tooltip: "Pickups the partner failed to complete on first attempt",
    formula: "Count of failed pickup events",
  },
  Exceptions: {
    tooltip: "Active shipment exceptions — address mismatches, damages, lost packages",
    formula: "Count of shipments with Exception Status ≠ Null",
  },
  "Days Stuck": {
    tooltip: "Days this shipment has been stuck in exception status",
    formula: "TODAY − Exception Raised Date",
  },
  "POs Inspected": {
    tooltip: "Count of POs that have passed through quality inspection",
    formula: "Count of POs with QC complete",
  },
  "First-Pass": {
    tooltip: "Units passing quality inspection on first attempt",
    formula: "Units Passed First Inspection / Total Inspected × 100",
  },
  "Top Defect": {
    tooltip: "Most frequent defect type observed for this vendor",
    formula: "MODE(defect_type)",
  },
  Severity: {
    tooltip: "Impact severity of this defect category — drives action priority",
    formula: "Classified by financial and operational impact",
  },
  Resolution: {
    tooltip: "Action required to resolve units affected by this defect",
    formula: "Defect playbook lookup",
  },
  Count: {
    tooltip: "Number of items in this row's category",
    formula: "COUNT(*)",
  },
  "% of Total": {
    tooltip: "This row's share of the table total",
    formula: "Row Count / Total Count × 100",
  },
  Total: {
    tooltip: "Total fabric quantity available for this type",
    formula: "SUM(fabric_total_units)",
  },
  Free: {
    tooltip: "Fabric quantity uncommitted to active POs — available to book",
    formula: "Total − Committed",
  },
  "At Risk": {
    tooltip: "Fabric at risk of ageing out before commitment to POs",
    formula: "Sum of fabric with Age > threshold or expiry within 30d",
  },
  Cause: {
    tooltip: "Underlying reason behind the current status",
    formula: "Derived from raw status string",
  },

  // ── Store Performance Dashboard — KPI Cards ──────────────────────────
  "Gross Revenue AOP": {
    tooltip: "Sum of planned/target revenue for the selected period",
    formula: "SUM(aop_gross_revenue)",
  },
  Achievement: {
    tooltip: "Actual gross revenue as a percentage of the AOP target for the selected period",
    formula: "Gross Revenue Actual ÷ Gross Revenue AOP × 100",
  },
  "Avg NRM%": {
    tooltip: "Net Revenue Margin — net revenue as a percentage of gross revenue across all stores in scope",
    formula: "Net Revenue ÷ Gross Revenue × 100",
  },
  "Total Sq Ft": {
    tooltip: "Sum of store trading area in square feet for all stores in scope",
    formula: "SUM(sqft)",
  },
};

/**
 * Worked examples for the Metric Glossary — a concrete calculation per metric.
 * Authored progressively; merged into METRIC_DESCRIPTIONS at module load so the
 * glossary's "Worked example" section is populated. Add more keys over time.
 */
const METRIC_EXAMPLES: Record<string, string> = {
  "Gross Revenue": "₹1,180 Cr billed − ₹27 Cr returns = ₹1,153 Cr gross revenue for April.",
  "Net Revenue vs Plan": "₹949 Cr actual ÷ ₹1,000 Cr planned = 94.9% — running ~5% behind plan.",
  "Gross Margin": "₹406 Cr gross margin ÷ ₹949 Cr net revenue = 42.8% — ₹0.43 kept per ₹1 sold.",
  "Avg Sell-Through": "62k units sold ÷ (62k sold + 225k in stock) = 21.6% sold through this season.",
  "Revenue Run Rate": "₹949 Cr net revenue ÷ 30 billing days = ₹31.6 Cr per day on average.",
  "Total Inventory Value": "Stores ₹2,100 Cr + warehouse ₹780 Cr + in-transit ₹120 Cr = ₹3,000 Cr saleable stock.",
  "Intake Margin %": "₹520 Cr intake margin ÷ ₹949 Cr net revenue = 54.8% — the ceiling before markdowns erode it.",
  "Sell Through": "1,300 units sold ÷ (1,300 + 3,700 in stock) = 26% sell-through for this style.",
  "Aged Inv": "₹694 Cr aged (>120d) ÷ ₹2,965 Cr total stock = 23.4% — more than double the 10% target.",
  Fresh: "₹1,014 Cr under 45 days ÷ ₹2,965 Cr total = 34.2% fresh, against a 68% goal.",
  Mix: "Fashion grade ₹620 Cr ÷ ₹949 Cr total revenue = 65% of revenue comes from Fashion.",
  Markdown: "₹38 Cr markdowns ÷ ₹620 Cr gross = 6.1% of gross given away in price cuts.",
  Stores: "228 distinct active sites traded in the Trends format this month.",
  "Units Sold": "1.0 Cr items sold across all Trends stores in April.",
  "Stock Value": "Womens Wear closing stock valued at ₹312 Cr at the latest closing date.",
  "Days On Hand": "84k units in stock ÷ 7k sold per day = 12 days of cover left.",
  Turnover: "₹949 Cr annualised revenue ÷ ₹3,000 Cr average inventory = 3.2 turns a year.",
  "Total Options": "1,240 distinct style-colour options are live in Mens Casual.",
  "Broken Sets": "180 options are missing one or more pivotal sizes.",
  "Value At Risk": "₹46 Cr of stock sits in broken-set options — hard to sell until replenished.",
  "Avg Missing Sizes": "Across 180 broken options, each is missing 2.3 key sizes on average.",
  "Rev/Store": "₹745 Cr zone revenue ÷ 410 stores = ₹1.8 Cr revenue per store.",
  "Avg SPSF": "₹14,200 of sales per square foot of selling space, averaged across the zone.",
  "Avg GMROF": "₹6,050 of gross margin earned per square foot of floor space.",
  "Fill Rate": "8,800 units received ÷ 10,000 ordered = 88% fill rate on this PO.",
  "Lead Time": "Average 34 days from PO creation to dispatch (AWB) for this vendor.",
  "On Time": "920 of 1,000 PO units arrived by the committed date = 92% on-time.",
  OTIF: "805 units arrived on time AND in full (within 5%) ÷ 1,000 ordered = 80.5% OTIF.",
  Throughput: "12,000 units processed ÷ 22 working days = ~545 units per day.",
  "PO Qty": "2.4 L units sit on open purchase orders placed with this vendor.",
  "0-30 days": "₹890 Cr received in the last 30 days ÷ ₹2,965 Cr total = 30% freshest stock.",
  "31-60 days": "₹620 Cr aged 31-60d ÷ ₹2,965 Cr = 21% — still in the prime selling window.",
  "61-90 days": "₹430 Cr aged 61-90d ÷ ₹2,965 Cr = 14.5% — approaching the markdown zone.",
  "91-180 days": "₹330 Cr aged 91-180d ÷ ₹2,965 Cr = 11% — only core lines should sit here.",
  ">180 days": "₹695 Cr over 180 days ÷ ₹2,965 Cr = 23.4% at high markdown / write-off risk.",
  "GM%": "₹406 Cr gross margin ÷ ₹949 Cr net revenue = 42.8% for this group.",
};

for (const [key, example] of Object.entries(METRIC_EXAMPLES)) {
  const entry = METRIC_DESCRIPTIONS[key];
  if (entry) entry.example = example;
}

/**
 * Batch 2 — worked examples for the remaining genuine metrics (table columns, KPI
 * cards, AOP/variance, store-intelligence, sourcing). Pure dimension/identifier/status
 * columns (Name, Grade, Zone, Vendor Code, Status, etc.) are intentionally excluded —
 * a worked example only makes sense for a calculated value. Figures are kept consistent
 * with batch 1 (≈₹949 Cr net / ₹1,153 Cr gross / ₹2,965 Cr stock) so cross-metric reads
 * stay coherent.
 */
const METRIC_EXAMPLES_2: Record<string, string> = {
  // ── Revenue & margin ──────────────────────────────────────────────────
  Revenue: "₹949 Cr of net revenue (excl. tax) booked for this product group in April.",
  "Net Revenue": "₹1,153 Cr gross less returns, discounts and deductions = ₹949 Cr net revenue.",
  "Net Rev": "₹949 Cr after returns, discounts and deductions.",
  "Gross Rev": "₹949 Cr net revenue (excl. tax) for this product group.",
  Value: "₹1,153 Cr of gross revenue value for the period.",
  Volume: "62,000 units sold during the period.",
  Vol: "62,000 units sold or planned in the period.",
  COGS: "₹543 Cr — the cost of the units sold this period.",
  "GM (₹)": "₹949 Cr net revenue − ₹543 Cr COGS = ₹406 Cr gross margin.",
  "Del GM%": "₹406 Cr delivered margin ÷ ₹949 Cr net revenue = 42.8% after markdowns.",
  "Delivered GM%": "₹406 Cr delivered margin ÷ ₹949 Cr net revenue = 42.8% after markdowns.",
  "Intake GM": "₹520 Cr intake margin ÷ ₹949 Cr net revenue = 54.8% locked in at procurement.",
  GMROI: "₹406 Cr gross margin ÷ ₹150 Cr average stock at cost = ₹2.71 returned per ₹1 of stock.",
  ASP: "₹949 Cr net revenue ÷ 1.04 Cr units sold = ₹912 average selling price.",
  ROS: "62,000 units ÷ (1,842 stores × 30 days) = ~1.1 units per store per day.",
  "Rate of Sale Per Day": "62,000 units ÷ (1,842 stores × 30 days) = ~1.1 units per store per day.",
  "Rate of Sale of Quantity Per Day": "62,000 units ÷ (1,842 stores × 30 days) = ~1.1 units per store per day.",
  "Rev/Day": "₹949 Cr net revenue ÷ (1,842 stores × 30 days) = ₹1.7 lakh per store per day.",
  "Rev/Sqft": "₹56 lakh net revenue ÷ 4,000 sqft = ₹1,400 of revenue per square foot.",
  Markdown: "₹38 Cr markdowns ÷ ₹620 Cr gross = 6.1% of gross given away in price cuts.",
  "Markdown %": "₹38 Cr markdowns ÷ ₹1,180 Cr gross = 3.2% of gross given away in price cuts.",
  "Markdown Value": "₹3.8 Cr of markdown taken on this category.",
  "Markdown Impact": "₹26 Cr discounts + ₹38 Cr markdowns = ₹64 Cr eroding the ₹520 Cr intake margin.",
  "Markdown Cost as % of Revenue": "₹3.8 Cr markdown ÷ ₹118 Cr gross = 3.2% of revenue.",
  "Markdown Volume as % of Revenue": "9,000 markdown units ÷ 62,000 total sold = 14.5% of units.",
  Discount: "₹26 Cr of promo, loyalty and everyday discounts applied this period.",
  "Intake Margin": "If everything sold at full MRP, this assortment would yield ₹520 Cr of intake margin.",
  "IM %": "(₹1,200 MRP − ₹540 intake cost) ÷ ₹1,200 = 55% intake margin.",
  "IM%": "(₹1,200 MRP − ₹540 intake cost) ÷ ₹1,200 = 55% intake margin.",
  "Intake Value": "12,000 units × ₹450 intake cost = ₹54 lakh of goods received.",
  "Var to Plan": "₹949 Cr actual − ₹1,000 Cr plan = −₹51 Cr versus target.",

  // ── Sell-through, options & broken sizes ───────────────────────────────
  "ST %": "1,300 units sold ÷ (1,300 + 3,700 stock) = 26% sell-through.",
  "ST 30d": "1,800 units sold in 30 days ÷ (1,500 opening + 1,000 receipts) = 72% 30-day sell-through.",
  "Sell-Through%": "Sell-through averages 21.6% across stores in this zone.",
  "FP ST %": "950 full-price units ÷ (1,300 sold + 3,700 stock) = 19% full-price sell-through.",
  "First-Through Velocity": "3,300 units sold within 45 days of GRN ÷ 5,000 received = 66% first-through velocity.",
  "Cover %": "(3,700 stock ÷ 500 weekly sales = 7.4 wks) ÷ 8-wk target = 93% cover.",
  "Top-Up Units": "Target cover 5,000 − 3,700 on hand = 1,300 units to reorder.",
  "Broken": "180 broken options ÷ 1,240 total = 14.5% with incomplete size curves.",
  "Broken %": "180 broken options ÷ 1,240 total = 14.5% with incomplete size curves.",
  "Broken Set Options": "180 options across stores are missing one or more pivotal sizes.",
  "At-Risk Revenue": "Broken-size options can't fulfil ~₹46 Cr of estimated demand.",
  "Size Completeness": "1,560 of 2,000 store-options carry the full size run = 78%.",
  "Options Aged >45d": "320 options have sat over 45 days with low sell-through — markdown candidates.",
  "Options in MD Stage 3": "48 options sit at the deepest markdown stage (50%+ off).",
  "Fashion Mix": "740 fashion options ÷ 1,240 total options = 60% of the assortment is fashion-grade.",
  "Chase Consumed": "₹8 Cr chase spend ÷ ₹12 Cr chase budget = 67% used to refill best-sellers.",

  // ── Inventory health & ageing ──────────────────────────────────────────
  "Aged Stock": "₹694 Cr older than 120 days ÷ ₹2,965 Cr total = 23.4% at markdown / write-off risk.",
  "Aged Stock (>180d)": "₹694 Cr older than 120 days ÷ ₹2,965 Cr total = 23.4% at markdown / write-off risk.",
  "Aged Stock (>120d)": "₹694 Cr older than 120 days ÷ ₹2,965 Cr total = 23.4% at markdown / write-off risk.",
  "Avg Aged Inventory": "Across regions, ₹694 Cr aged ÷ ₹2,965 Cr total = 23.4% average aged inventory.",
  "Fresh Inventory": "₹1,014 Cr under 45 days ÷ ₹2,965 Cr total = 34% fresh stock.",
  "Inventory Turns": "₹31.6 Cr daily revenue × 365 ÷ ₹3,000 Cr stock value = 3.8 turns a year (site-averaged).",
  "Inv Turns (annualised)": "₹949 Cr net revenue (LTM) ÷ ₹250 Cr avg stock at cost = 3.8 turns.",
  "Inventory Days": "84k units in stock ÷ 7k sold per day = 12 days of cover at the current pace.",
  "Days on Hand": "₹312 Cr closing stock ÷ ₹10.4 Cr avg daily revenue = 30 days of cover.",
  "NOOS Stockout": "46 stores currently have zero saleable stock on at least one core must-stock item.",
  "NOOS Stockout (Stores)": "46 stores currently have zero saleable stock on at least one core must-stock item.",
  "OTB Consumption": "₹47 Cr committed + in-progress POs ÷ ₹60 Cr OTB allocation = 78% of budget consumed.",
  "OTB Remaining": "₹60 Cr budget − ₹47 Cr committed = ₹13 Cr of open-to-buy left.",
  "Season End GM% Projection": "42.8% today, less ~3 pts of planned markdowns on remaining stock → ~39.8% at season end.",

  // ── Stocking balance ───────────────────────────────────────────────────
  "Right-Stocked": "1,180 of 1,842 stores sit in the 0.85-1.15 optimal stock band.",
  "Optimally Stocked": "1,180 of 1,842 stores sit in the 0.85-1.15 optimal stock band.",
  Overstocked: "420 stores carry a stock index above 1.15 — more than planned cover.",
  Understocked: "242 stores sit below 0.85 — short of planned cover.",
  "Est. Uplift": "Velocity uplift of 40 units/wk × ₹900 ASP = ~₹36k extra revenue per week.",
  Units: "1,300 units involved in this reallocation.",

  // ── Geography & store rollups ──────────────────────────────────────────
  "Total Stores": "1,842 distinct active store locations across all formats.",
  "Avg Revenue/Store": "₹31.6 Cr daily net revenue ÷ 1,842 stores = ₹1.7 lakh per store per day.",
  "Avg GM%": "Gross margin averages 42.8% across the stores in this zone.",
  "Stores Carrying WW": "1,420 of 1,842 stores currently stock Womens Wear.",
  "Total Sq Ft": "1,842 stores totalling 73.6 lakh sq ft of trading area.",
  "VM Score": "88 of 100 on the visual-merchandising audit for this cluster.",
  Planogram: "92 of 100 fixtures comply with the prescribed planogram layout.",
  SOP: "85 of 100 on the standard-operating-procedure audit.",
  Score: "Weighted VM / Planogram / SOP = 88 composite store score.",

  // ── Category triage ────────────────────────────────────────────────────
  "Categories On-Track": "9 of 14 categories clear all three gates (ST ≥70%, Aged ≤10%, GM ≥42%).",
  "Markdown Triggers": "62 options meet markdown criteria but have no price action taken yet.",
  "Top-Up POs Pending": "23 replenishment POs for fast-selling SKUs are awaiting release.",

  // ── AOP plan & achievement ─────────────────────────────────────────────
  "AOP GM": "₹450 Cr AOP margin ÷ ₹1,000 Cr AOP net revenue = 45% planned gross margin.",
  "AOP GM%": "₹450 Cr planned margin ÷ ₹1,000 Cr planned net revenue = 45% AOP gross margin.",
  "AOP Volume": "1.1 Cr units planned for the period.",
  "AOP ASP": "₹1,000 Cr planned net revenue ÷ 1.1 Cr planned units = ₹909 planned ASP.",
  "AOP Intake GM": "₹560 Cr planned intake margin ÷ ₹1,000 Cr planned net revenue = 56% planned intake GM.",
  "AOP Gross Revenue": "₹1,200 Cr planned gross revenue for this sub-category.",
  "AOP Net Revenue": "₹980 Cr planned net revenue for this sub-category.",
  "Gross Revenue AOP/Plan": "The annual plan is ₹14,000 Cr gross — constant regardless of the date filter.",
  "Gross Revenue AOP": "₹1,200 Cr of planned / target revenue for the selected period.",
  "Achievement %": "₹1,153 Cr actual gross ÷ ₹1,200 Cr AOP plan for the window = 96.1% achievement.",
  Achievement: "₹1,153 Cr actual ÷ ₹1,200 Cr AOP = 96.1% of target.",
  "Avg NRM%": "₹949 Cr net ÷ ₹1,153 Cr gross = 82.3% net revenue margin.",
  "Volume (Thousands)": "62,000 units shown as 62K.",
  "Volume (Mn Units)": "1,04,00,000 units ÷ 10,00,000 = 10.4 Mn units.",
  "Gross Revenue (Lakhs)": "₹1,180 Cr gross revenue shown as 1,18,000 lakhs.",
  "Net Revenue (Lakhs)": "₹949 Cr net revenue shown as 94,900 lakhs.",
  "Gross Revenue (Cr)": "₹11,80,00,00,000 ÷ 1,00,00,000 = ₹1,180 Cr.",
  "Net Revenue (Cr)": "₹9,49,00,00,000 ÷ 1,00,00,000 = ₹949 Cr.",

  // ── Variance tracker (plan vs actual) ──────────────────────────────────
  "VT Volume": "1.1 Cr planned vs 1.04 Cr actually sold — a 5% volume shortfall.",
  "VT ASP": "₹909 planned ASP vs ₹912 actual — selling 0.3% above plan on price.",
  "VT Gross Revenue": "₹1,200 Cr planned gross vs ₹1,153 Cr actual — ₹47 Cr behind.",
  "VT Net Revenue": "₹980 Cr planned net vs ₹949 Cr actual — ₹31 Cr behind plan.",
  "VT Intake GM": "56% planned intake GM vs 54.8% actual — 1.2 pts of slippage.",
  "VT GM%": "45% planned GM vs 42.8% actual — a 2.2 pt margin miss.",
  "Rev Var": "(₹949 Cr actual − ₹1,000 Cr plan) ÷ ₹1,000 Cr = −5.1% revenue variance.",
  "GM Var": "42.8% actual − 45% plan = −220 bps gross-margin variance.",
  "SPSF Var": "(₹14,200 actual − ₹15,000 plan) ÷ ₹15,000 = −5.3% SPSF variance.",
  "Turns Var": "(3.8 actual − 4.0 plan) ÷ 4.0 = −5% inventory-turns variance.",

  // ── Store intelligence ─────────────────────────────────────────────────
  "Growth YoY": "(₹54.5 Cr this year − ₹50 Cr last year) ÷ ₹50 Cr = +9% YoY growth.",
  "LFL Growth %": "(₹54.5 Cr this year − ₹50 Cr last year) ÷ ₹50 Cr = +9% like-for-like growth.",
  "LFL 2Y CAGR": "(₹220 Cr now ÷ ₹182 Cr two years ago)^0.5 − 1 = +10% 2-year LFL CAGR.",
  "Fashion %": "620 fashion SKUs ÷ 1,000 total = 62% of the assortment is fashion.",
  Affluence: "Catchment scores 74/100 on spending power — supports premium lines.",
  Youth: "Catchment scores 71/100 on the 18-35 concentration index.",
  Family: "Catchment scores 68/100 on family-household prevalence.",
  "Fashion Fwd": "Catchment scores 73/100 on appetite for new trends.",
  Destination: "Store scores 82/100 as a planned destination vs an impulse stop.",
  "Category Strength": "Category overlap × competitor market share scores 62/100 in our overlapping categories.",
  "Best Rev.": "Ethnic wear peaked at ₹62 lakh in its best month.",
  "Best Rev": "Ethnic wear peaked at ₹62 lakh in its best month.",
  "Current Rev.": "Ethnic wear is doing ₹41 lakh this period.",
  "Current Rev": "Ethnic wear is doing ₹41 lakh this period.",
  "Revenue Index": "₹41 lakh store revenue ÷ ₹34 lakh network average = 120 (20% above average).",

  // ── Operations & fulfilment ────────────────────────────────────────────
  "Vendor OT": "920 of 1,000 PO units delivered by the committed date = 92% vendor on-time.",
  "Merchandise OT": "920 of 1,000 PO units delivered by the committed date = 92% on-time.",
  "Vendor OTIF": "805 of 1,000 PO units arrived on time AND in full (within 5%) = 80.5% OTIF.",
  "Merchandise OTIF": "805 of 1,000 PO units arrived on time AND in full (within 5%) = 80.5% OTIF.",
  "Vendor OTIF %": "805 of 1,000 PO units arrived on time AND in full (within 5%) = 80.5% OTIF.",
  "OTIF %": "805 of 1,000 PO units arrived on time AND in full (within 5%) = 80.5% OTIF.",
  "Vendor Fill Rate": "8,800 units received ÷ 10,000 ordered = 88% fill rate.",
  "Fill Rate %": "8,800 units received ÷ 10,000 ordered = 88% fill rate.",
  "GRN On-Time": "880 of 1,000 PO units had their GRN raised by the expected date = 88%.",
  "GRN On-Time %": "880 of 1,000 PO units had their GRN raised by the expected date = 88%.",
  "GRN On Time %": "880 of 1,000 PO units had their GRN raised by the expected date = 88%.",
  "Delayed POs": "37 POs are past their delivery date with no GRN or a late GRN.",
  "Delayed PO": "37 POs are past their delivery date with no GRN or a late GRN.",
  Delayed: "14 POs from this vendor or cluster are past their delivery date.",
  "Avg Lead Time": "POs in this bucket average 28 days from creation to AWB.",
  "Avg Lead": "Average 31 days from PO creation to delivery for this category.",
  "PO Count": "145 distinct POs fall in this lead-time range.",
  "Days Delayed": "This PO is 9 days past its committed delivery date.",
  "Ajio SLA %": "9,400 of 10,000 Ajio orders shipped within SLA = 94% on-time.",

  // ── Budget & PO pipeline ───────────────────────────────────────────────
  Budget: "₹60 Cr of open-to-buy allocated for the period.",
  "# POs": "18 purchase orders raised against this budget.",
  Committed: "₹47 Cr committed via approved and open POs.",
  Open: "₹47 Cr committed − ₹39 Cr received = ₹8 Cr still open.",
  "Util %": "₹47 Cr committed ÷ ₹60 Cr budget = 78% utilised.",
  Remaining: "₹60 Cr budget − ₹47 Cr committed = ₹13 Cr remaining.",
  "PO Value": "₹6.2 Cr of open PO value sits with this vendor.",
  "Share %": "₹6.2 Cr vendor value ÷ ₹60 Cr total open = 10.3% share.",
  "POs Below Target": "12 POs fall below the intake-margin target.",
  "Value at Risk": "₹4.8 Cr of open PO value has intake margin below target.",
  "In Production": "85 POs are currently being manufactured.",
  "In Transit": "62 POs are en route from vendor to DC.",
  Delivered: "140 POs have been physically delivered to the DC.",
  "GRN Done": "118 POs have a generated and reconciled GRN.",
  "Open POs": "340 POs are in progress from creation through to GRN.",
  "In-Transit POs": "85 POs are currently in transit from vendor to warehouse.",
  "Total POs": "1,240 purchase orders created this season.",
  "GRN Pending": "23 POs are delivered but still awaiting a Goods Receipt Note.",
  "Vendor Concentration": "Top vendor's ₹14 Cr ÷ ₹60 Cr total intake = 23% — a concentration flag.",

  // ── Sourcing director ──────────────────────────────────────────────────
  "Vendors at Risk": "6 vendors fall below 70% fill rate or 75% OTIF — flagged for escalation.",
  "Active Vendors": "92 distinct vendors have at least one open PO.",
  "DC Dwell Time": "Average 18 hours from warehouse receipt to dispatch.",
  "Delivery SLA": "9,300 of 10,000 shipments arrived within the SLA window = 93%.",
  "Shipment Exceptions": "37 shipments are flagged with address mismatches, damage or loss.",
  "Intransit Delays": "52 shipments are running beyond their expected hub-to-hub transit time.",
  "Fabric Utilization": "78,000 m committed ÷ 1,00,000 m capacity = 78% — nearing the 85% alert.",
  "Available Fabric": "1,00,000 m total − 78,000 m committed = 22,000 m free to book.",
  "Committed Fabric": "78,000 m allocated to active (non-cancelled) POs.",
  "At-Risk Fabric": "12,000 m of fabric is ageing out or expiring within 30 days.",
  "Quality Pass Rate": "9,600 of 10,000 inspected units passed = 96% quality pass rate.",
  Quality: "9,400 of 10,000 units passed QC for this vendor = 94%.",
  "Audit Compliance": "44 of 50 audited factories passed = 88% audit compliance.",
  Compliance: "920 of 1,000 POs within the negotiated cost range = 92%.",
  "Cost Compliance": "920 of 1,000 POs fell within the negotiated cost range = 92%.",
  "Sample Approval %": "85 of 100 samples approved on first review = 85%.",
  "Sample Approval": "85 of 100 samples approved on first review = 85%.",
  "RFID Compliance": "880 of 1,000 POs were correctly RFID-tagged at source = 88%.",
  "RFID Accuracy": "9,500 of 10,000 scanned units matched RFID = 95% accuracy.",
  "Pack-by-Store": "910 of 1,000 POs are correctly configured for direct store delivery = 91%.",
  "First-Pass Yield": "9,200 of 10,000 units passed inspection first time = 92% first-pass yield.",
  "First-Pass": "9,200 of 10,000 units passed inspection first time = 92%.",
  "Defect Rate": "180 defective ÷ 10,000 inspected = 1.8% — within the 2% target.",
  "PO-to-Shelf": "Average 28 days from PO creation to store shelf — inside the 30-day target.",
  "PO-to-GRN": "Average 22 days from PO creation to GRN (PO→GRN leg only).",
  "Inventory Latency": "Inventory changes reflect in analytics in ~45 seconds on average.",
  "Capacity/mo": "This vendor can produce 50,000 units a month.",
  "Current Load": "32,000 units in production against this vendor's open POs.",
  "Load %": "32,000 current load ÷ 50,000 capacity = 64% utilised.",
  "POs Inspected": "420 POs have completed quality inspection.",
  Shipments: "1,250 shipments handled by this delivery partner.",
  "SLA Met": "1,160 of 1,250 shipments hit the SLA window = 93%.",
  "Avg Days": "Average 4.2 days transit time for this partner.",
  "Failed Pickups": "18 pickups the partner missed on first attempt.",
  Exceptions: "37 shipments are sitting in exception status.",
  "Days Stuck": "This shipment has been in exception status for 6 days.",
  Total: "1,00,000 m of this fabric type available.",
  Free: "1,00,000 m total − 78,000 m committed = 22,000 m free to book.",
  "At Risk": "12,000 m of fabric is ageing out or expiring within 30 days.",
  Count: "145 items in this category.",
  "% of Total": "145 of 1,240 = 11.7% of the table total.",
};

for (const [key, example] of Object.entries(METRIC_EXAMPLES_2)) {
  const entry = METRIC_DESCRIPTIONS[key];
  if (entry) entry.example = example;
}
