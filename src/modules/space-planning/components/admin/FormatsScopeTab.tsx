import { cn } from '@/lib/utils';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  ADMIN_CATEGORIES,
  ADMIN_FORMATS,
  AdminSectionCard,
  TabErrorSummary,
} from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';

const TAB = 'format_category';

export function FormatsScopeTab(): React.ReactNode {
  const formatCategory = useAdminConfigStore((s) => s.draft?.format_category);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!formatCategory) return null;

  const toggle = (format: string, category: string): void => {
    const current = formatCategory[format] ?? [];
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category].sort();
    updateSection('format_category', { ...formatCategory, [format]: next });
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard title="Categories planned per store format">
        <p className="text-xs text-gray-500 mb-3">
          Stores of a format only get space plans for the categories enabled here.
        </p>
        <div className="space-y-3">
          {ADMIN_FORMATS.map((format) => {
            const enabled = formatCategory[format] ?? [];
            const error = findFieldError(fieldErrors, TAB, format);
            return (
              <div
                key={format}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="w-44 text-sm font-medium text-gray-700">{format}</span>
                <div className="flex flex-wrap gap-2">
                  {ADMIN_CATEGORIES.map((cat) => {
                    const on = enabled.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${format}: toggle ${cat}`}
                        onClick={() => toggle(format, cat)}
                        className={cn(
                          'min-h-[36px] rounded-lg border px-3 py-1 text-sm font-medium transition-colors',
                          on
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                {error && <span className="text-xs text-red-600">{error}</span>}
              </div>
            );
          })}
        </div>
      </AdminSectionCard>
    </div>
  );
}
