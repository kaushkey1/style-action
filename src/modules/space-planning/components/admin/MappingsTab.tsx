import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Checkbox,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Input,
  Label,
} from '@/components/ui';
import { useAdminConfigStore } from '../../stores/useAdminConfigStore';
import {
  AdminSectionCard,
  TabErrorSummary,
} from './adminConfigShared';
import type { AdminMappings } from '../../api/adminConfigApi';

const TAB = 'mappings';
const BRICK_POD_RENDER_CAP = 100;

export function MappingsTab(): React.ReactNode {
  const mappings = useAdminConfigStore((s) => s.draft?.mappings);
  const fieldErrors = useAdminConfigStore((s) => s.fieldErrors);
  const updateSection = useAdminConfigStore((s) => s.updateSection);

  const [brickSearch, setBrickSearch] = useState('');
  const [newBrand, setNewBrand] = useState('');

  if (!mappings) return null;

  const setMappings = (next: AdminMappings): void => updateSection('mappings', next);

  // ── brick → pod label ──────────────────────────────────────────────────
  const search = brickSearch.trim().toLowerCase();
  const filteredBrick = mappings.brick_pod
    .map((row, index) => ({ row, index }))
    .filter(({ row }) =>
      search === ''
        ? true
        : [row.category, row.brand, row.brick, row.pod_label].some((v) =>
            v.toLowerCase().includes(search),
          ),
    );
  const visibleBrick = filteredBrick.slice(0, BRICK_POD_RENDER_CAP);

  const setPodLabel = (index: number, podLabel: string): void => {
    setMappings({
      ...mappings,
      brick_pod: mappings.brick_pod.map((r, i) =>
        i === index ? { ...r, pod_label: podLabel } : r,
      ),
    });
  };

  // ── pod xwalk ──────────────────────────────────────────────────────────
  const patchXwalk = (
    index: number,
    patch: Partial<AdminMappings['pod_xwalk'][number]>,
  ): void => {
    setMappings({
      ...mappings,
      pod_xwalk: mappings.pod_xwalk.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    });
  };
  const addXwalkRow = (): void => {
    setMappings({
      ...mappings,
      pod_xwalk: [
        ...mappings.pod_xwalk,
        { subcategory: '', category: '', pod_id: '', seq: mappings.pod_xwalk.length + 1 },
      ],
    });
  };
  const removeXwalkRow = (index: number): void => {
    setMappings({
      ...mappings,
      pod_xwalk: mappings.pod_xwalk.filter((_, i) => i !== index),
    });
  };

  // ── brand scope ────────────────────────────────────────────────────────
  const toggleBrand = (index: number, isActive: boolean): void => {
    setMappings({
      ...mappings,
      brand_scope: mappings.brand_scope.map((r, i) =>
        i === index ? { ...r, is_active: isActive } : r,
      ),
    });
  };
  const addBrand = (): void => {
    const brand = newBrand.trim().toUpperCase();
    if (!brand || mappings.brand_scope.some((b) => b.brand === brand)) return;
    setMappings({
      ...mappings,
      brand_scope: [...mappings.brand_scope, { brand, is_active: true }].sort((a, b) =>
        a.brand.localeCompare(b.brand),
      ),
    });
    setNewBrand('');
  };

  return (
    <div className="space-y-4">
      <TabErrorSummary errors={fieldErrors} tab={TAB} />

      <AdminSectionCard
        title={`Brick → Pod Labels (${mappings.brick_pod.length} rows)`}
        actions={
          <Input
            aria-label="Search brick-pod mappings"
            placeholder="Search category / brand / brick / pod…"
            value={brickSearch}
            onChange={(e) => setBrickSearch(e.target.value)}
            className="h-8 w-full sm:w-72 text-sm"
          />
        }
      >
        {filteredBrick.length === 0 ? (
          <p className="text-sm text-gray-500">No rows match the search.</p>
        ) : (
          <>
            {filteredBrick.length > BRICK_POD_RENDER_CAP && (
              <p className="text-xs text-amber-600 mb-2">
                Showing first {BRICK_POD_RENDER_CAP} of {filteredBrick.length} rows — refine the
                search to see the rest.
              </p>
            )}
            <div className="overflow-x-auto -mx-1 px-1">
              <DataTable className="min-w-[640px]">
                <DataTableHeader>
                    <DataTableHead>Category</DataTableHead>
                    <DataTableHead>Brand</DataTableHead>
                    <DataTableHead>Brick</DataTableHead>
                    <DataTableHead>Pod label</DataTableHead>
                  </DataTableHeader>
                <DataTableBody>
                  {visibleBrick.map(({ row, index }) => (
                    <DataTableRow key={`${row.category}|${row.brand}|${row.brick}`}>
                      <DataTableCell className="text-gray-500">{row.category}</DataTableCell>
                      <DataTableCell className="text-gray-700">{row.brand}</DataTableCell>
                      <DataTableCell className="text-gray-700">{row.brick}</DataTableCell>
                      <DataTableCell>
                        <Input
                          aria-label={`${row.brand} ${row.brick} pod label`}
                          value={row.pod_label}
                          onChange={(e) => setPodLabel(index, e.target.value)}
                          className="h-8 w-44 text-sm"
                        />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title={`Subcategory → Pod Crosswalk (${mappings.pod_xwalk.length} rows)`}
        actions={
          <Button variant="outline" size="sm" onClick={addXwalkRow}>
            <Plus className="w-4 h-4 mr-1" />
            Add row
          </Button>
        }
      >
        {mappings.pod_xwalk.length === 0 ? (
          <p className="text-sm text-gray-500">
            No crosswalk rows yet — add rows to map subcategories to pods.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <DataTable className="min-w-[640px]">
              <DataTableHeader>
                  <DataTableHead>Subcategory</DataTableHead>
                  <DataTableHead>Category</DataTableHead>
                  <DataTableHead>Pod id</DataTableHead>
                  <DataTableHead>Seq</DataTableHead>
                  <DataTableHead className="w-10" aria-label="Actions" />
                </DataTableHeader>
              <DataTableBody>
                {/* index keys are intentional: rows are positional while being edited */}
                {mappings.pod_xwalk.map((row, i) => (
                  <DataTableRow key={i}>
                    <DataTableCell>
                      <Input
                        aria-label={`Crosswalk row ${i + 1} subcategory`}
                        value={row.subcategory}
                        onChange={(e) => patchXwalk(i, { subcategory: e.target.value })}
                        className="h-8 w-40 text-sm"
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <Input
                        aria-label={`Crosswalk row ${i + 1} category`}
                        value={row.category}
                        onChange={(e) => patchXwalk(i, { category: e.target.value })}
                        className="h-8 w-24 text-sm"
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <Input
                        aria-label={`Crosswalk row ${i + 1} pod id`}
                        value={row.pod_id}
                        onChange={(e) => patchXwalk(i, { pod_id: e.target.value })}
                        className="h-8 w-40 text-sm"
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <Input
                        type="number"
                        aria-label={`Crosswalk row ${i + 1} sequence`}
                        value={String(row.seq)}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isNaN(n)) patchXwalk(i, { seq: n });
                        }}
                        className="h-8 w-16 text-sm"
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <button
                        type="button"
                        aria-label={`Remove crosswalk row ${i + 1}`}
                        onClick={() => removeXwalkRow(i)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title={`Brand Scope (${mappings.brand_scope.filter((b) => b.is_active).length} active)`}
        actions={
          <div className="flex items-center gap-2">
            <Input
              aria-label="New brand name"
              placeholder="Add brand…"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addBrand();
              }}
              className="h-8 w-full sm:w-44 text-sm"
            />
            <Button variant="outline" size="sm" onClick={addBrand} disabled={!newBrand.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        }
      >
        {mappings.brand_scope.length === 0 ? (
          <p className="text-sm text-gray-500">
            No brand scope rows yet — add brands to scope the private-label universe.
          </p>
        ) : (
          // eslint-disable-next-line design-system/prefer-metric-grid -- brand checkbox grid, not metric cards
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
            {mappings.brand_scope.map((row, i) => (
              <div key={row.brand} className="flex items-center gap-2">
                <Checkbox
                  id={`brand-${row.brand}`}
                  checked={row.is_active}
                  onCheckedChange={(v) => toggleBrand(i, v === true)}
                />
                <Label
                  htmlFor={`brand-${row.brand}`}
                  className={row.is_active ? 'text-sm text-gray-900' : 'text-sm text-gray-400'}
                >
                  {row.brand}
                </Label>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Unchecking deactivates a brand for future runs — nothing is hard-deleted.
        </p>
      </AdminSectionCard>
    </div>
  );
}
