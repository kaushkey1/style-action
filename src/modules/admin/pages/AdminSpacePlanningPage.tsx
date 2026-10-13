// The mock GMROF admin screen was replaced by the live, API-backed config
// screen (ADMIN_CONFIG_SPEC.md). Kept as a named re-export so the existing
// /admin/space-planning route registration keeps working unchanged.
export { AdminSpacePlanningConfigPage as AdminSpacePlanningPage } from '@/modules/space-planning/pages/AdminSpacePlanningConfigPage';
