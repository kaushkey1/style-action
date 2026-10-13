/* KPI strip + loading shimmers shared by the AOP store-performance / store-detail
   drill pages. Extracted from the former AOPDashboardPage monolith when the
   dashboard was replaced by the converged page. */
import type { ReactNode } from "react";
import { MetricCard, MetricGrid } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AOPSummaryCard } from "../api/aopApi";

const AOP_METRIC_KEYS: Partial<Record<string, string>> = {
  "Volume": "AOP Volume",
  "VOLUME": "AOP Volume",
  "ASP": "AOP ASP",
  "Gross Revenue": "AOP Gross Revenue",
  "GROSS REVENUE": "AOP Gross Revenue",
  "Net Revenue": "AOP Net Revenue",
  "NET REVENUE": "AOP Net Revenue",
  "Intake GM": "AOP Intake GM",
  "INTAKE GM": "AOP Intake GM",
  "GM%": "AOP GM%",
};

interface KPIStripProps {
  cards: AOPSummaryCard[] | null;
}

// Format display value with unit intelligently
function formatValueWithUnit(displayValue: string, unit: string): string {
  // If value is "NA", don't add units
  if (displayValue === "NA" || displayValue === "N/A" || displayValue === "na") {
    return displayValue;
  }

  // If unit is "x", don't show it
  if (unit === "x") {
    return displayValue;
  }

  // If unit is just "₹" or already included in display_value, return as is
  if (unit === "₹" || displayValue.includes(unit)) {
    return displayValue;
  }

  // If unit starts with "₹" (like "₹ Cr"), split and format as ₹{value} Cr
  if (unit.startsWith("₹")) {
    const suffix = unit.substring(1).trim(); // Extract "Cr", "Lakhs", etc.
    if (suffix) {
      // Remove ₹ from display_value if it exists
      const cleanValue = displayValue.replace("₹", "").trim();
      return `₹${cleanValue} ${suffix}`;
    }
    return displayValue;
  }

  // For percentage, append directly (no space)
  if (unit === "%") {
    return `${displayValue}%`;
  }

  // For other units (like "Mn Units"), append with space
  return `${displayValue} ${unit}`;
}

export function KPIStrip({ cards }: KPIStripProps): ReactNode {
  if (!cards?.length) {
    return <div className="text-sm text-gray-500">No data available</div>;
  }

  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- 2-up mobile / 4-up desktop KPI strip with custom gap scale
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
          value={formatValueWithUnit(card.display_value, card.unit)}
          infoKey={AOP_METRIC_KEYS[card.label] ?? (typeof card.label === "string" ? card.label : undefined)}
        />
      ))}
    </div>
  );
}

function ShimmerBlock({ className }: { className?: string }): ReactNode {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
}

export function KPIStripShimmer(): ReactNode {
  return (
    <div className="space-y-4">
      <MetricGrid columns={4}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
            <ShimmerBlock className="h-3 w-20" />
            <ShimmerBlock className="h-7 w-28" />
          </div>
        ))}
      </MetricGrid>
      <MetricGrid columns={4}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
            <ShimmerBlock className="h-3 w-20" />
            <ShimmerBlock className="h-7 w-28" />
          </div>
        ))}
      </MetricGrid>
    </div>
  );
}

export function TableShimmer({ rows = 8 }: { rows?: number }): ReactNode {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 flex gap-4">
        <ShimmerBlock className="h-3 w-32" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <ShimmerBlock key={i} className="h-3 w-16 ml-auto" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-100 flex gap-4">
          <ShimmerBlock className="h-4 w-40" />
          {[0, 1, 2, 3, 4, 5, 6].map((j) => (
            <ShimmerBlock key={j} className="h-4 w-14 ml-auto" />
          ))}
        </div>
      ))}
    </div>
  );
}
