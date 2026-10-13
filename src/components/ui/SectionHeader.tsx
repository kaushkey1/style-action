import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  addPadding?: boolean;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /**
   * Keep the title and actions on one row at ALL breakpoints (title wraps on the
   * left, actions pinned top-right). Default false = the standard responsive
   * behavior (actions stack below the title on mobile, inline from md up).
   * Use for compact headers with a single action (e.g. a chart drill-down kebab).
   */
  inlineActions?: boolean;
}

export function SectionHeader({
  addPadding = false,
  title,
  subtitle,
  actions,
  className,
  inlineActions = false,
}: SectionHeaderProps) {
  const headerClassName = cn(
    { "p-4": addPadding },
    inlineActions
      ? "flex flex-row items-center justify-between gap-2 mb-3"
      : "flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3",
    className,
  );

  return (
    <div className={headerClassName}>
      <div className={inlineActions ? "min-w-0" : "shrink-0"}>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className={cn("flex items-center gap-2", inlineActions && "shrink-0")}>{actions}</div>}
    </div>
  );
}
