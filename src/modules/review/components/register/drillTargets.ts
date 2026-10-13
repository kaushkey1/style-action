import { Store, Boxes, LineChart } from 'lucide-react';
import { getDrillRoute, type DrillTarget } from '@/lib/routing';

/**
 * Cross-view drill targets for a Register item, scoped by its category, wired to
 * the real drill routing (`getDrillRoute`). A target with no resolvable route is
 * dropped rather than fabricated. Shared by the detail "Drill into" chips and the
 * left-pane row kebab (DrillMenu) so both offer identical destinations.
 */
export function getRegisterDrillTargets(category: string): DrillTarget[] {
  const scope = { category, from: 'action-register' };
  return [
    { id: 'store-view', label: 'Open in Store View', icon: Store, preview: 'Store performance', to: getDrillRoute('store-view', scope) },
    { id: 'inventory', label: 'Open in Inventory', icon: Boxes, preview: 'Stock & ageing', to: getDrillRoute('inventory', scope) },
    { id: 'aop', label: 'Open in AOP plan', icon: LineChart, preview: 'Plan vs actual', to: getDrillRoute('aop', scope) },
  ].filter((t) => t.to !== '');
}
