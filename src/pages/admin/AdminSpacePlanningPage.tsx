// Legacy duplicate of the /admin/space-planning route (routes.tsx registers it
// after modules/admin/route.tsx, which wins). Points at the same live config
// screen so both registrations render identically.
export { AdminSpacePlanningConfigPage as AdminSpacePlanningPage } from '@/modules/space-planning/pages/AdminSpacePlanningConfigPage';
