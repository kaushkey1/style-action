import type { ReactNode } from "react";
import { AopConverged } from "../components/AopConverged";

/**
 * AOP page — the converged Target + Variance surface. The `initialVariance` flag
 * lets the legacy Variance Tracker routes open with the variance toggle pre-on.
 */
export function AOPDashboardPage({ initialVariance = false }: { initialVariance?: boolean }): ReactNode {
  return <AopConverged initialVariance={initialVariance} />;
}
