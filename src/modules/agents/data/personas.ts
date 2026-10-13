export type PersonaId =
  | "ceo"
  | "apex"
  | "category"
  | "sourcing"
  | "marketing"
  | "regional"
  | "ops"
  | "admin";

export interface PersonaTab {
  id: string;
  name: string;
  icon: string;
  /** Legacy mock KPI strip (deprecated). */
  kpis: Array<{
    id: string;
    name: string;
    value: string;
    target: string;
    status: "on_track" | "warning" | "critical" | "neutral";
    icon: string;
  }>;
}

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  tabs: PersonaTab[];
}

/**
 * UI persona configuration (tabs + labels). This is not “mock data” — it defines the app’s navigation
 * and which API tab slug each persona can request.
 */
export const personaMap: Record<PersonaId, PersonaConfig> = {
  ceo: {
    id: "ceo",
    name: "CEO / Business Head",
    tabs: [
      { id: "ceo-pulse", name: "Business Pulse", icon: "activity", kpis: [] },
      { id: "ceo-inventory", name: "Inventory Health", icon: "package", kpis: [] },
      { id: "ceo-geography", name: "Geography", icon: "map-pin", kpis: [] },
      { id: "ceo-categories", name: "Categories", icon: "shopping-bag", kpis: [] },
      { id: "ceo-supply", name: "Operations & Supply Chain", icon: "truck", kpis: [] },
      { id: "financial", name: "Financial", icon: "wallet", kpis: [] },
    ],
  },
  apex: {
    id: "apex",
    name: "Apex Leadership",
    tabs: [
      { id: "apex-overview", name: "Overview", icon: "sparkles", kpis: [] },
      { id: "apex-pulse", name: "Business Pulse", icon: "activity", kpis: [] },
      { id: "apex-inventory", name: "Inventory Health", icon: "package", kpis: [] },
      { id: "apex-geography", name: "Geography", icon: "map-pin", kpis: [] },
      { id: "apex-supply", name: "Operations", icon: "truck", kpis: [] },
      { id: "apex-financial", name: "Financial", icon: "wallet", kpis: [] },
      { id: "apex-categories", name: "Categories", icon: "shopping-bag", kpis: [] },
      { id: "apex-working-capital", name: "Working Capital", icon: "layers", kpis: [] },
    ],
  },
  category: {
    id: "category",
    name: "Category Director",
    tabs: [
      { id: "pnl", name: "P&L", icon: "wallet", kpis: [] },
      { id: "sell-through", name: "Sell-through", icon: "trending-up", kpis: [] },
      { id: "range-otb", name: "Range & OTB", icon: "layers", kpis: [] },
      { id: "cat-store-health", name: "Store Health", icon: "map-pin", kpis: [] },
      { id: "lifecycle", name: "Lifecycle", icon: "clock", kpis: [] },
    ],
  },
  sourcing: {
    id: "sourcing",
    name: "Sourcing Director",
    tabs: [
      { id: "src-financial", name: "Margins & Compliance", icon: "wallet", kpis: [] },
      { id: "vendor-perf", name: "Vendor Performance", icon: "truck", kpis: [] },
      { id: "po-pipeline", name: "PO Pipeline", icon: "package", kpis: [] },
      { id: "fabric", name: "Fabric Position", icon: "layers", kpis: [] },
      { id: "quality", name: "Quality", icon: "alert-triangle", kpis: [] },
      { id: "src-logistics", name: "Logistics & RFID", icon: "truck", kpis: [] },
    ],
  },
  marketing: {
    id: "marketing",
    name: "Marketing Director",
    tabs: [
      { id: "mkt-financial", name: "Financial", icon: "wallet", kpis: [] },
      { id: "mkt-customer", name: "Customer", icon: "users", kpis: [] },
      { id: "campaigns", name: "Campaigns", icon: "zap", kpis: [] },
      { id: "channel-mix", name: "Channel Mix", icon: "layers", kpis: [] },
      { id: "crm", name: "CRM", icon: "users", kpis: [] },
      { id: "content", name: "Content Pipeline", icon: "sparkles", kpis: [] },
    ],
  },
  regional: {
    id: "regional",
    name: "Regional Director",
    tabs: [
      { id: "reg-financial", name: "Financial", icon: "wallet", kpis: [] },
      { id: "store-rankings", name: "Store Rankings", icon: "trending-up", kpis: [] },
      { id: "competition", name: "Competition", icon: "target", kpis: [] },
      { id: "vm-compliance", name: "VM Compliance", icon: "package-check", kpis: [] },
    ],
  },
  ops: {
    id: "ops",
    name: "Operations Lead",
    tabs: [
      { id: "ops-overview", name: "Overview", icon: "sparkles", kpis: [] },
      { id: "ops-operations", name: "Operations", icon: "truck", kpis: [] },
      { id: "delivery", name: "Delivery", icon: "truck", kpis: [] },
      { id: "inventory", name: "Inventory", icon: "package", kpis: [] },
      { id: "customer-service", name: "Customer Service", icon: "users", kpis: [] },
    ],
  },
  admin: {
    id: "admin",
    name: "Admin",
    tabs: [],
  },
};

export const personas: Array<{ id: PersonaId; name: string; icon: string }> = [
  { id: "ceo", name: "CEO / Business Head", icon: "building" },
  { id: "apex", name: "Apex Leadership", icon: "layers" },
  { id: "category", name: "Category Director", icon: "settings" },
  { id: "sourcing", name: "Sourcing Director", icon: "truck" },
  { id: "regional", name: "Regional Director", icon: "map-pin" },
  { id: "marketing", name: "Marketing Director", icon: "megaphone" },
  { id: "ops", name: "Operations Lead", icon: "truck" },
  { id: "admin", name: "Admin", icon: "shield-check" },
];

