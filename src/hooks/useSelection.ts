import { useState, useCallback } from 'react';

export function useSelection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  return { selectedId, setSelectedId, clearSelection };
}
