import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseColumnVisibilityResult {
  /** Headers to render: locked first column, then the visible toggleable columns in order. */
  displayHeaders: string[];
  /** Visible toggleable keys (ordered), reconciled against the current header set. */
  visibleKeys: string[];
  /** Replace the visible toggleable keys (e.g. from ColumnFilterDropdown's onApply). */
  setVisibleKeys: (keys: string[]) => void;
  /** Default visible toggleable keys — used for the dropdown's Reset. */
  defaultVisibleKeys: string[];
  /** The always-visible first column key (undefined when headers is empty). */
  lockedKey: string | undefined;
  /** All non-locked column keys (the toggleable set). */
  toggleable: string[];
  /** Index of a header within a row's `values` array (i.e. its position in headers.slice(1)); -1 if absent. */
  valueIndexOf: (header: string) => number;
}

/**
 * Show/hide + reorder management for a table whose columns are identified by their
 * header labels. The first header is treated as a locked (always-visible) column;
 * the rest are toggleable. Defaults to the first `defaultVisibleCount` columns
 * visible (locked + the next `defaultVisibleCount - 1`).
 *
 * Pass `enabled: false` to keep every column visible (current behaviour / no-op).
 * Selection resets when the underlying column set changes (e.g. an API shape switch).
 */
export function useColumnVisibility(
  headers: string[],
  options?: { enabled?: boolean; defaultVisibleCount?: number },
): UseColumnVisibilityResult {
  const enabled = options?.enabled ?? true;
  const defaultVisibleCount = options?.defaultVisibleCount ?? 5;

  // Stable identity for the header set so memos/effects only react to real changes.
  const headersSig = headers.join('');

  const { lockedKey, toggleable } = useMemo(
    () => ({ lockedKey: headers[0], toggleable: headers.slice(1) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- headersSig captures `headers` content
    [headersSig],
  );

  const defaultVisibleKeys = useMemo(
    () =>
      enabled
        ? toggleable.slice(0, Math.max(0, defaultVisibleCount - 1))
        : [...toggleable],
    [toggleable, enabled, defaultVisibleCount],
  );

  const [visibleKeys, setVisibleKeys] = useState<string[]>(defaultVisibleKeys);

  // Re-sync to defaults when the column set changes (stable ref otherwise, so a
  // user's Apply selection is preserved across unrelated re-renders).
  useEffect(() => {
    setVisibleKeys(defaultVisibleKeys);
  }, [defaultVisibleKeys]);

  // Drop any keys no longer present (stale between a column-set change and the effect).
  const safeVisible = useMemo(
    () => visibleKeys.filter((k) => toggleable.includes(k)),
    [visibleKeys, toggleable],
  );

  const displayHeaders = useMemo(
    () => (lockedKey != null ? [lockedKey, ...safeVisible] : [...safeVisible]),
    [lockedKey, safeVisible],
  );

  const valueIndexOf = useCallback(
    (header: string): number => toggleable.indexOf(header),
    [toggleable],
  );

  return {
    displayHeaders,
    visibleKeys: safeVisible,
    setVisibleKeys,
    defaultVisibleKeys,
    lockedKey,
    toggleable,
    valueIndexOf,
  };
}
