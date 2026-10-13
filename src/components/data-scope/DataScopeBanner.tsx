import { useState } from "react";
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertIcon,
  Button,
} from "@/components/ui";
import { DataScopeModal } from "./DataScopeModal";

interface DataScopeBannerProps {
  /** Note copy shown in the banner. Each call site supplies its own page-specific phrasing. */
  note: string;
  /**
   * `sm` matches the original Dashboard / Variance Tracker styling (text-xs px-3 py-2).
   * `md` matches the original AOP Dashboard styling (text-sm px-4 py-2.5).
   */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Drop-in replacement for the inline "Note: This view provides…" banner that
 * previously lived on the Command Dashboard, AOP Dashboard, and Variance
 * Tracker pages. Adds a `View Data Scope` action that opens a shared modal
 * (bottom sheet on mobile) disclosing the underlying dataset.
 */
export function DataScopeBanner({
  note,
  size = "sm",
  className,
}: DataScopeBannerProps): React.ReactNode {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Alert variant="info" size={size} truncateOnMobile className={className}>
        <AlertIcon />
        <AlertContent>
          <AlertDescription>{note}</AlertDescription>
        </AlertContent>
        <AlertAction>
          <Button
            variant="ghost"
            size="sm"
            // 44px tap target on mobile (WCAG 2.5.5); 32px on desktop where hover suffices.
            className="min-h-11 lg:min-h-8 text-primary-700 hover:text-primary-800 hover:bg-primary-100"
            onClick={() => setIsModalOpen(true)}
          >
            View Data Scope
          </Button>
        </AlertAction>
      </Alert>

      <DataScopeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
