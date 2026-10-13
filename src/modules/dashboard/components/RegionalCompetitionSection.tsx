import { SectionHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { COMPETITION_ALERTS } from "../data/mockRegional";

// ---------------------------------------------------------------------------
// Severity → left border color
// ---------------------------------------------------------------------------

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-blue-400",
};

// ---------------------------------------------------------------------------
// Critical Alerts
// ---------------------------------------------------------------------------

export function RegionalCompetitionSection(): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Critical Alerts" />
      <div className="space-y-3 mt-3">
        {COMPETITION_ALERTS.map((alert, idx) => (
          <div
            key={idx}
            className={cn("border-l-4 rounded-r-lg bg-gray-50 p-3", SEVERITY_BORDER[alert.severity])}
          >
            <p className="text-sm text-gray-900">{alert.text}</p>
            <span className="text-xs text-gray-500 mt-1 block">{alert.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
