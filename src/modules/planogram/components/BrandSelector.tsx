import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanogramStore } from '../stores/usePlanogramStore';

export default function BrandSelector(): React.ReactNode {
  const brands = usePlanogramStore((s) => s.brands);
  const selectedBrandId = usePlanogramStore((s) => s.selectedBrandId);
  const brandsLoading = usePlanogramStore((s) => s.brandsLoading);
  const brandsError = usePlanogramStore((s) => s.brandsError);
  const uploadStatus = usePlanogramStore((s) => s.uploadStatus);
  const selectBrand = usePlanogramStore((s) => s.selectBrand);
  const loadBrands = usePlanogramStore((s) => s.loadBrands);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedBrand = brands.find((b) => b.brand_id === selectedBrandId);
  const isDisabled = brandsLoading || uploadStatus === 'uploading';

  // Load brands on mount
  useEffect(() => {
    if (brands.length === 0) {
      loadBrands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: loadBrands is stable
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectBrand = (brandId: string): void => {
    selectBrand(brandId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredBrands = brands.filter((brand) =>
    brand.brand_id_desc.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {brandsError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {brandsError}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          disabled={isDisabled}
          // eslint-disable-next-line design-system/prefer-section-header -- This is a dropdown button, not a section header
          className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus-kb:ring-2 focus-kb:ring-indigo-500 focus-kb:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-0"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="text-left">
            {brandsLoading ? (
              <span className="text-gray-500">Loading brands...</span>
            ) : selectedBrand ? (
              <span className="text-gray-900">{selectedBrand.brand_id_desc}</span>
            ) : (
              <span className="text-gray-500">Select a brand</span>
            )}
          </span>
          {brandsLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          )}
        </button>

        {isOpen && !brandsLoading && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {/* eslint-disable-next-line no-restricted-syntax -- Need raw input for dropdown search */}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search brands..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus-kb:ring-2 focus-kb:ring-indigo-500 focus-kb:border-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Search brands"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-auto" role="listbox">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <button
                    key={brand.brand_id}
                    type="button"
                    role="option"
                    aria-selected={selectedBrandId === brand.brand_id}
                    onClick={() => handleSelectBrand(brand.brand_id)}
                    className={cn(
                      'w-full px-4 py-3 md:py-2 text-left hover:bg-gray-50 flex items-center justify-between',
                      selectedBrandId === brand.brand_id && 'bg-blue-50 hover:bg-blue-100',
                    )}
                  >
                    <span className="font-medium text-gray-900">
                      {brand.brand_id_desc}
                    </span>
                    {selectedBrandId === brand.brand_id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No brands found matching &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
