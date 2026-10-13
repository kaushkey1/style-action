import {
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  ADMIN_CATEGORIES,
  AdminSectionCard,
  NumberField,
  PendingEngineBadge,
  TabErrorSummary,
} from './adminConfigShared';
import { findFieldError } from './adminConfigHelpers';

const TAB = 'category_min_space';

const CATEGORY_FULL_LABELS: Record<string, string> = {
  WIW: "Women's Indian Wear",
  WWW: "Women's Western Wear",
  MC: "Men's Casual",
  MF: "Men's Formal",
  KW: "Kid's Wear",
};

/** Business-requirement defaults (PL apparel minimum-space table, total 3,308). */
const RECOMMENDED_MIN_SQFT: Record<string, number> = {
  WIW: 643,
  WWW: 754,
  MC: 453,
  MF: 860,
  KW: 598,
};

export function CategoryMinimumsTab(): React.ReactNode {
  const catMin = useAdminConfigStore((s) => s.draft?.category_min_space);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  if (!catMin) return null;

  const setMin = (category: string, value: number): void => {
    updateSection('category_min_space', { ...catMin, [category]: value });
  };

  const prefillRecommended = (): void => {
    updateSection('category_min_space', { ...RECOMMENDED_MIN_SQFT });
  };

  const total = ADMIN_CATEGORIES.reduce((sum, cat) => sum + (catMin[cat] ?? 0), 0);
  const isConfigured = Object.keys(catMin).length > 0;

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard
        title="Category Minimum Space (sqft)"
        badge={<PendingEngineBadge />}
        actions={
          !isConfigured ? (
            <Button size="sm" variant="outline" onClick={prefillRecommended}>
              Prefill recommended values
            </Button>
          ) : undefined
        }
      >
        <p className="text-xs text-gray-500 mb-3">
          Minimum PL apparel space per category for a full store. For stores with less
          total space than the overall requirement, the engine will scale each minimum
          proportionally — every category keeps its % share of the total. Stored and
          versioned now; the engine consumes it in a later release.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <DataTable className="min-w-[520px]">
            <DataTableHeader>
              <DataTableHead>Category</DataTableHead>
              <DataTableHead>Minimum space (sqft)</DataTableHead>
              <DataTableHead>% of total</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {ADMIN_CATEGORIES.map((cat) => {
                const value = catMin[cat] ?? 0;
                const error = findFieldError(fieldErrors, TAB, cat);
                const share = total > 0 && value > 0 ? (value / total) * 100 : 0;
                return (
                  <DataTableRow key={cat}>
                    <DataTableCell className="font-medium text-gray-900">
                      {CATEGORY_FULL_LABELS[cat] ?? cat}
                      <span className="ml-1.5 text-xs font-normal text-gray-500">{cat}</span>
                      {error && <div className="text-xs font-normal text-red-600">{error}</div>}
                    </DataTableCell>
                    <DataTableCell>
                      <NumberField
                        ariaLabel={`${cat} minimum space in sqft`}
                        value={value}
                        onChange={(v) => setMin(cat, v)}
                        inputClassName="w-32"
                        error={undefined}
                      />
                      {value <= 0 && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          Recommended: {RECOMMENDED_MIN_SQFT[cat]}
                        </div>
                      )}
                    </DataTableCell>
                    <DataTableCell className="text-gray-600">
                      {share > 0 ? `${share.toFixed(1)}%` : '—'}
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
              <DataTableRow>
                <DataTableCell className="font-semibold text-gray-900">
                  Total minimum PL apparel requirement
                </DataTableCell>
                <DataTableCell className="font-semibold text-gray-900">
                  {total > 0 ? formatNumber(total) : '—'}
                </DataTableCell>
                <DataTableCell className="text-gray-600">
                  {total > 0 ? '100%' : '—'}
                </DataTableCell>
              </DataTableRow>
            </DataTableBody>
          </DataTable>
        </div>
        {!isConfigured && (
          <p className="mt-3 text-xs text-gray-500">
            Not configured yet — use “Prefill recommended values” to load the business
            requirement (total 3,308 sqft), review, and save. Partial tables are rejected:
            the proportional scaling is only well-defined with every category present.
          </p>
        )}
      </AdminSectionCard>
    </div>
  );
}
