import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  /** Right-aligned content (badges, buttons, controls) */
  actions?: React.ReactNode;
  /** Inline badges next to the title */
  badges?: React.ReactNode;
  /** Back navigation. Renders an icon-only back button inline, left of the title. Accepts a path string or { label, path } (label used for the aria-label only). */
  backTo?: string | { label: string; path: string };
  /** Back as a callback for state-driven detail views (no route change). Takes precedence over backTo. */
  onBack?: () => void;
  /** Tabs for page navigation */
  tabs?: Tab[];
  className?: string;
}

/**
 * Standard page header. Renders flush with page content — no background fill,
 * no banner border, no extra horizontal padding (the page's own padding handles
 * inset). Detail pages pass `backTo` for an inline icon-only back button on the
 * same line as the title. Spacing to the next section is owned by `space-y-4`.
 */
export function PageHeader({
  title,
  actions,
  badges,
  backTo,
  onBack,
  tabs,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const backPath = typeof backTo === "string" ? backTo : backTo?.path;
  const backLabel = typeof backTo === "string" ? undefined : backTo?.label;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {(onBack ?? backTo) && (
            <button
              type="button"
              onClick={() => (onBack ? onBack() : navigate(backPath!))}
              aria-label={backLabel ? `Back to ${backLabel}` : "Back"}
              className="-ml-1 shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary/40"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {badges}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="mt-4 flex gap-6 border-b border-gray-200">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={tab.onClick}
              className={cn(
                "-mb-px py-3 border-b-2 text-sm font-medium transition-colors",
                tab.isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
