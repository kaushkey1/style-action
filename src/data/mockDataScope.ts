/**
 * Mock data for the Data Scope banner / modal feature.
 *
 * Used by `<DataScopeBanner>` (and its `<DataScopeModal>` detail surface) to
 * disclose the dataset that backs a given view (Command Dashboard, AOP
 * Dashboard, Variance Tracker). Static snapshot — not derived from active
 * filters.
 */
import { formatDate, getDataAvailableThroughDate } from '@/lib/utils';

/** Default range start for the standard data-scope snapshot (season / FY start). */
const SNAPSHOT_RANGE_START_ISO = '2026-04-01';

/**
 * Standard data-scope disclosure note for snapshot dashboards (Command,
 * Category Director, Sourcing). The end date is the latest available data
 * (today − DATA_FRESHNESS_LAG_DAYS), formatted via the shared date helper so it
 * stays accurate and never goes stale.
 */
export function getDataScopeSnapshotNote(): string {
  const from = formatDate(SNAPSHOT_RANGE_START_ISO);
  const to = formatDate(getDataAvailableThroughDate());
  return `A consolidated snapshot of inwarded articles, with data from ${from} to ${to} (2-day lag).`;
}

export interface BrandCategory {
  /** Display name (e.g. "Private Label") */
  name: string;
  /** Brand-count label (e.g. "126 brands") */
  brandCount: string;
  /** Monetary value label (e.g. "₹687 Cr" or "—" when not applicable) */
  value: string;
  /** Share-of-total label (e.g. "56%" or "<1%") */
  percentage: string;
}

export interface DataScopeData {
  brands: {
    total: number;
    categories: BrandCategory[];
  };
  storeFormats: {
    total: number;
    items: string[];
  };
  segments: {
    total: number;
    items: string[];
  };
  sbus: {
    total: number;
    items: string[];
  };
  /** Amber callout shown at the bottom of the modal */
  masterDataCallout: string;
}

export const mockDataScope: DataScopeData = {
  brands: {
    total: 618,
    categories: [
      { name: "Private Label", brandCount: "126 brands", value: "₹687 Cr", percentage: "56%" },
      { name: "Manufacturer Brand", brandCount: "420 brands", value: "₹272 Cr", percentage: "22%" },
      { name: "Unclassified", brandCount: "63 brands", value: "₹257 Cr", percentage: "21%" },
      { name: "Indie", brandCount: "8 brands", value: "₹0.4 Cr", percentage: "<1%" },
      { name: "International", brandCount: "1 brand", value: "—", percentage: "<1%" },
    ],
  },
  storeFormats: {
    total: 15,
    items: [
      "Trends",
      "Fashion Factory",
      "Yousta",
      "Azorte",
      "GAP",
      "Kalaniketan",
      "Avantra",
      "Centro",
      "John Player",
      "Lee Cooper",
      "Performax",
      "Grocery Centro",
      "Metro Junior",
      "Smart",
      "Fashion World",
    ],
  },
  segments: {
    total: 14,
    items: [
      "Mens Casual",
      "Mens Wear",
      "Womens Wear",
      "Kid Wear",
      "Kid Footwear",
      "Lady Footwear",
      "Mens Footwear",
      "Sport Footwear",
      "Beauty",
      "Lingerie",
      "Luggage",
      "Brands",
      "Toy",
      "Watch",
    ],
  },
  sbus: {
    total: 5,
    items: ["Apparel & Luggage", "Beauty", "Brand", "Footwear", "Lifestyle"],
  },
  masterDataCallout:
    "20 brands (DNMX, John Players, Lee Cooper, RIO, Fusion, etc.) have no brand_type in master data — likely private labels.",
};
