import type { AdminFieldError } from '../../api/adminConfigApi';

// Separate from adminConfigShared.tsx so that file only exports components
// (react-refresh/only-export-components).

export function findFieldError(
  errors: AdminFieldError[],
  tab: string,
  field: string,
): string | undefined {
  return errors.find((e) => e.tab === tab && e.field === field)?.error;
}

export function tabHasErrors(errors: AdminFieldError[], tab: string): boolean {
  return errors.some((e) => e.tab === tab);
}
