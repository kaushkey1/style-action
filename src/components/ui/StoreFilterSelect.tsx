import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Search, X, Loader2, Check } from 'lucide-react';
import { cn, apiHeaders, apiUrl } from '@/lib/utils';

interface ApiStore {
  store_id: string;
  store_name: string | null;
  store_category: string | null;
}

interface StoreFilterSelectProps {
  value: string | null;
  onChange: (storeId: string | null) => void;
  className?: string;
}

const MAX_VISIBLE = 50;

export function StoreFilterSelect({ value, onChange, className }: StoreFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [stores, setStores] = useState<ApiStore[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  const fetchStores = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(apiUrl(`/otb/stores${params}`), { headers: apiHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data;
      if (data?.stores) {
        setStores(data.stores);
      }
    } catch {
      // API unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stores on first open
  useEffect(() => {
    if (isOpen && !loadedRef.current) {
      loadedRef.current = true;
      fetchStores();
    }
  }, [isOpen, fetchStores]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || !loadedRef.current) return;
    if (!search.trim()) {
      fetchStores();
      return;
    }
    const timer = setTimeout(() => {
      fetchStores(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isOpen, fetchStores]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const displayStores = useMemo(() =>
    stores.slice(0, MAX_VISIBLE).map((s) => ({
      id: s.store_id,
      name: s.store_name ?? s.store_id,
      grade: s.store_category ?? '—',
    })),
    [stores],
  );

  function handleSelect(storeId: string) {
    // Toggle: if already selected, deselect
    onChange(value === storeId ? null : storeId);
    setIsOpen(false);
    setSearch('');
  }

  function handleToggle() {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setSearch('');
    }
  }

  const selectedMatch = value ? stores.find((s) => s.store_id === value) : null;
  const displayName = selectedMatch?.store_name ?? value;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-colors',
          value
            ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span className="max-w-[10rem] truncate">{value ? displayName : 'All Stores'}</span>
        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="ml-0.5 p-0.5 rounded hover:bg-primary/20 transition-colors"
            aria-label="Clear store filter"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stores..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Store list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <p className="text-xs text-gray-500">Loading stores...</p>
              </div>
            ) : displayStores.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-xs text-gray-500">No stores found</p>
              </div>
            ) : (
              displayStores.map((store) => {
                const isSelected = value === store.id;
                return (
                  <button
                    key={store.id}
                    onClick={() => handleSelect(store.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-gray-50',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span className={cn('text-xs font-medium truncate', isSelected ? 'text-primary' : 'text-gray-900')}>
                        {store.name}
                      </span>
                    </div>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {store.grade}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Results count hint */}
          {search.trim() && displayStores.length === MAX_VISIBLE && (
            <div className="px-3 py-1.5 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing first {MAX_VISIBLE} results. Refine your search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
