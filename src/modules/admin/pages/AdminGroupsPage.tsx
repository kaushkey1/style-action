import { useState, useMemo } from 'react';
import {
  Users,
  Layers,
  MapPin,
  Grid3X3,
  Search,
  ChevronRight,
  Building2,
  Target,
  Store,
  X,
  ArrowRight,
} from 'lucide-react';
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, Input, MetricGrid, Pagination, usePagination, PageHeader, SectionHeader, EmptyState } from '@/components/ui';
import {
  functionalGroups,
  productPods,
  productPodTotal,
  operationsPods,
  operationsPodTotal,
  roles,
  kpiGroups,
  sampleStoresByPod,
} from '../data/mockAdminData';
import { cn } from '@/lib/utils';

// ── Helper: map roleId -> escalation target name ──

function getEscalationTargetName(roleId: string): string | null {
  const role = roles.find((r) => r.id === roleId);
  if (!role || !role.escalationTarget) return null;
  const target = roles.find((r) => r.id === role.escalationTarget);
  return target ? target.name : role.escalationTarget;
}

// ── Helper: get relevant KPI groups for a functional group ──

function getRelevantKpiGroups(groupName: string, _roleName: string): string[] {
  const mapping: Record<string, string[]> = {
    'CEO Office': ['Executive Scorecard', 'Category Performance'],
    'Sourcing Leadership': ['Sourcing & Supply Chain'],
    'Marketing Leadership': ['Marketing Performance'],
    'Mumbai Cluster': ['Store Operations', 'Category Performance'],
    'Andheri Store Team': ['Store Operations'],
    'Andheri Associates': ['Store Operations'],
    'Control Tower Ops': ['Executive Scorecard', 'Store Operations'],
  };
  if (mapping[groupName]) return mapping[groupName];
  if (_roleName.includes('Store Manager') || _roleName.includes('Associate')) return ['Store Operations'];
  if (_roleName.includes('Cluster')) return ['Store Operations'];
  return ['Executive Scorecard'];
}

// ── Operations Pod SPOCs data ──

const opsPodSpocs: Record<number, { revMerchSpoc: string; hrSpoc: string; logisticsSpoc: string }> = {
  1: { revMerchSpoc: 'Priyanka D.', hrSpoc: 'Suresh M.', logisticsSpoc: 'Anand R.' },
  2: { revMerchSpoc: 'Sneha K.', hrSpoc: 'Ravi P.', logisticsSpoc: 'Mohan T.' },
  3: { revMerchSpoc: 'Kavita S.', hrSpoc: 'Deepak N.', logisticsSpoc: 'Ajay V.' },
  4: { revMerchSpoc: 'Nisha G.', hrSpoc: 'Ramesh B.', logisticsSpoc: 'Tarun K.' },
  5: { revMerchSpoc: 'Aruna L.', hrSpoc: 'Venkat R.', logisticsSpoc: 'Srikanth M.' },
  6: { revMerchSpoc: 'Meghna P.', hrSpoc: 'Ashok D.', logisticsSpoc: 'Kiran S.' },
  7: { revMerchSpoc: 'Swathi R.', hrSpoc: 'Manjunath K.', logisticsSpoc: 'Prasad N.' },
  8: { revMerchSpoc: 'Divya M.', hrSpoc: 'Lakshman S.', logisticsSpoc: 'Ganesh V.' },
  9: { revMerchSpoc: 'Pooja B.', hrSpoc: 'Sachin T.', logisticsSpoc: 'Nilesh R.' },
  10: { revMerchSpoc: 'Rekha J.', hrSpoc: 'Jitendra P.', logisticsSpoc: 'Vivek C.' },
};

// ── Functional Groups Tab ──

function FunctionalGroupsTab() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const selectedGroup = selectedGroupId
    ? functionalGroups.find((g) => g.id === selectedGroupId) ?? null
    : null;

  const [currentPage, setCurrentPage] = useState(1);
  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(functionalGroups, 10);
  const pageItems = getPageItems(currentPage);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">{functionalGroups.length} functional groups configured</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Org Nodes</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageItems.length === 0 ? (
              <tr><td colSpan={4}><EmptyState description="No functional groups to display" /></td></tr>
            ) : pageItems.map((group) => (
              <tr
                key={group.id}
                onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
                className={cn(
                  'cursor-pointer transition-colors duration-150',
                  selectedGroupId === group.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium text-gray-900">{group.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" size="sm">{group.roleName}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{group.orgNodes}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-gray-900">{group.memberCount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      {/* Detail panel for selected group */}
      {selectedGroup && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Group Details</h3>
            <button
              type="button"
              onClick={() => setSelectedGroupId(null)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close detail panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-500">Group Name</span>
              <span className="font-medium text-gray-900">{selectedGroup.name}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-500">Role</span>
              <Badge variant="outline" size="sm">{selectedGroup.roleName}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-500">Org Scope</span>
              <span className="text-gray-900">{selectedGroup.orgNodes}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-500">Member Count</span>
              <span className="font-semibold text-gray-900">{selectedGroup.memberCount}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-500">Escalation Target</span>
              <span className="text-gray-900">
                {getEscalationTargetName(selectedGroup.roleId) || <span className="text-gray-500">None (top-level)</span>}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 block mb-1">KPI Groups Assigned</span>
              <div className="flex flex-wrap gap-1">
                {getRelevantKpiGroups(selectedGroup.name, selectedGroup.roleName).map((name) => {
                  const kg = kpiGroups.find((k) => k.name === name);
                  return (
                    <Badge key={name} variant="info" size="sm">
                      {name}{kg ? ` (${kg.kpiCount} KPIs)` : ''}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-2">
        <span className="text-sm text-gray-600">
          Total members across all groups
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {functionalGroups.reduce((sum, g) => sum + g.memberCount, 0)}
        </span>
      </div>
    </div>
  );
}

// ── Product Pods Tab ──

const CATEGORY_OPTIONS = [
  'All',
  'Menswear',
  'Women Indian Wear',
  'Women Western',
  'Kids Wear',
  'Non-Apparel & Beauty',
  'External Brands',
] as const;

function ProductPodsTab() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPod, setSelectedPod] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPods = useMemo(() => {
    let pods = productPods;
    if (categoryFilter !== 'all') {
      pods = pods.filter((p) => p.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pods = pods.filter(
        (p) =>
          p.subCategory.toLowerCase().includes(q) ||
          p.brands.some((b) => b.toLowerCase().includes(q)) ||
          p.rmLead.toLowerCase().includes(q)
      );
    }
    return pods;
  }, [categoryFilter, searchQuery]);

  const selectedPodData = selectedPod !== null
    ? productPods.find((p) => p.podNumber === selectedPod)
    : null;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORY_OPTIONS.map((cat) => {
            const value = cat === 'All' ? 'all' : cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200',
                  categoryFilter === value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30'
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search pods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs w-48"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {/* Table */}
        <div className={cn('flex-1 min-w-0', selectedPodData && 'max-w-[calc(100%-320px)]')}>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-14">Pod #</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Category</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Brands</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">FY27 Target</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">R&M Lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPods.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState description="No product pods to display" /></td></tr>
                  ) : filteredPods.map((pod) => (
                    <tr
                      key={pod.podNumber}
                      onClick={() => setSelectedPod(selectedPod === pod.podNumber ? null : pod.podNumber)}
                      className={cn(
                        'cursor-pointer transition-colors duration-150',
                        selectedPod === pod.podNumber
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          {pod.podNumber}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={
                            pod.category === 'Menswear' ? 'primary' :
                            pod.category === 'Women Indian Wear' ? 'secondary' :
                            pod.category === 'Women Western' ? 'info' :
                            pod.category === 'Kids Wear' ? 'success' :
                            pod.category === 'Non-Apparel & Beauty' ? 'warning' :
                            'default'
                          }
                          size="sm"
                        >
                          {pod.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{pod.subCategory}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-xs max-w-[200px]">
                        <span className="truncate block">{pod.brands.join(', ')}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                        {'\u20B9'}{pod.fy27Target.toLocaleString('en-IN')} Cr
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <span>{pod.rmLead}</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total row */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 mt-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-700">
              Total ({filteredPods.length === productPods.length ? '24 pods' : `${filteredPods.length} of 24 pods`})
            </span>
            <span className="text-sm font-bold text-gray-900">
              {'\u20B9'}{filteredPods.length === productPods.length
                ? productPodTotal.toLocaleString('en-IN')
                : filteredPods.reduce((sum, p) => sum + p.fy27Target, 0).toLocaleString('en-IN')
              } Cr
            </span>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedPodData && (
          <div className="w-[300px] shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4 space-y-4">
              <SectionHeader
                title={`Pod ${selectedPodData.podNumber} Details`}
                actions={
                  <button
                    onClick={() => setSelectedPod(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                    aria-label="Close detail panel"
                  >
                    Close
                  </button>
                }
                className="mb-0"
              />

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <Badge variant="primary" size="sm">{selectedPodData.category}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sub-Category</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPodData.subCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Brands</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPodData.brands.map((brand) => (
                      <Badge key={brand} variant="outline" size="sm">{brand}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">FY27 Target</p>
                    <p className="text-sm font-bold text-gray-900">{'\u20B9'}{selectedPodData.fy27Target.toLocaleString('en-IN')} Cr</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Team Size</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPodData.teamSize}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">R&M Lead</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {selectedPodData.rmLead.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{selectedPodData.rmLead}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Operations Pods Tab ──

function OperationsPodsTab() {
  const [selectedPodNum, setSelectedPodNum] = useState<number | null>(null);

  const selectedPodData = selectedPodNum !== null
    ? operationsPods.find((p) => p.podNumber === selectedPodNum) ?? null
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">10 operations pods covering all regions</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-14">Pod #</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">POD Head</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Geography Lead</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Stores</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Rev %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operationsPods.length === 0 ? (
              <tr><td colSpan={6}><EmptyState description="No operations pods to display" /></td></tr>
            ) : operationsPods.map((pod) => (
              <tr
                key={pod.podNumber}
                onClick={() => setSelectedPodNum(selectedPodNum === pod.podNumber ? null : pod.podNumber)}
                className={cn(
                  'cursor-pointer transition-colors duration-150',
                  selectedPodNum === pod.podNumber ? 'bg-primary/5' : 'hover:bg-gray-50'
                )}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary/10 text-secondary text-xs font-bold">
                    {pod.podNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{pod.region}</p>
                    <p className="text-xs text-gray-500">{pod.states.join(', ')}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{pod.podHead}</td>
                <td className="px-4 py-3 text-gray-700">{pod.geographyLead}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {pod.storeCount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      { }
                      <div
                        className="h-full bg-secondary rounded-full"
                        // eslint-disable-next-line no-restricted-syntax -- dynamic width
                        style={{ width: `${pod.revenueSharePct}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 w-8 text-right">{pod.revenueSharePct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Detail panel for selected operations pod */}
      {selectedPodData && (() => {
        const spocs = opsPodSpocs[selectedPodData.podNumber];
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Pod {selectedPodData.podNumber} &mdash; {selectedPodData.region}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPodNum(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close detail panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-sm">
                <span className="text-gray-500 block text-xs">Pod Number</span>
                <span className="font-medium text-gray-900">{selectedPodData.podNumber}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block text-xs">Region</span>
                <span className="font-medium text-gray-900">{selectedPodData.region}</span>
              </div>
              <div className="text-sm col-span-2">
                <span className="text-gray-500 block text-xs">States Covered</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {selectedPodData.states.map((s) => (
                    <Badge key={s} variant="outline" size="sm">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block text-xs">POD Head</span>
                <span className="font-medium text-gray-900">{selectedPodData.podHead}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block text-xs">Geography Lead</span>
                <span className="font-medium text-gray-900">{selectedPodData.geographyLead}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block text-xs">Store Count</span>
                <span className="font-semibold text-gray-900">{selectedPodData.storeCount.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500 block text-xs">Revenue Share</span>
                <span className="font-semibold text-gray-900">{selectedPodData.revenueSharePct}%</span>
              </div>
              {spocs && (
                <>
                  <div className="col-span-2 border-t border-gray-100 pt-2 mt-1">
                    <span className="text-xs font-medium text-gray-500">Additional Team</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 block text-xs">Rev & Merch SPOC</span>
                    <span className="font-medium text-gray-900">{spocs.revMerchSpoc}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 block text-xs">HR SPOC</span>
                    <span className="font-medium text-gray-900">{spocs.hrSpoc}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 block text-xs">Logistics SPOC</span>
                    <span className="font-medium text-gray-900">{spocs.logisticsSpoc}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Total row */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">Total</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{operationsPodTotal.stores.toLocaleString('en-IN')}</span> stores
          </span>
          <span className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{operationsPodTotal.revenueSharePct}%</span> revenue
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Store-to-Pod Matrix Tab ──

function StoreToPodMatrixTab() {
  const [selectedMatrixPod, setSelectedMatrixPod] = useState<number>(1);

  const currentPod = productPods.find((p) => p.podNumber === selectedMatrixPod);
  const stores = sampleStoresByPod[selectedMatrixPod] ?? sampleStoresByPod[1] ?? [];

  return (
    <div className="space-y-4">
      {/* Pod Selector */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-sm font-medium text-gray-700">Select Pod:</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {productPods.map((pod) => (
            <button
              key={pod.podNumber}
              onClick={() => setSelectedMatrixPod(pod.podNumber)}
              className={cn(
                'w-8 h-8 rounded-lg border text-xs font-bold transition-all duration-200',
                selectedMatrixPod === pod.podNumber
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30'
              )}
            >
              {pod.podNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Pod Info */}
      {currentPod && (
        <div className="bg-primary/5 rounded-lg border border-primary/20 p-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-gray-900">
              Showing stores in Pod {currentPod.podNumber} ({currentPod.subCategory} &mdash; {currentPod.brands[0]})
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Category: {currentPod.category} | R&M Lead: {currentPod.rmLead} | Team Size: {currentPod.teamSize}
          </p>
        </div>
      )}

      {/* Store List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Store Code</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Sq. Ft.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stores.length === 0 ? (
              <tr><td colSpan={6}><EmptyState description="No stores to display" /></td></tr>
            ) : stores.map((store) => (
              <tr
                key={store.code}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-4 py-3">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{store.code}</code>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900">{store.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{store.city}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" size="sm">{store.state}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      store.format === 'Flagship' ? 'primary' :
                      store.format === 'Mall' ? 'info' :
                      store.format === 'High Street' ? 'success' :
                      'default'
                    }
                    size="sm"
                  >
                    {store.format}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {store.sqFt.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Showing {stores.length} stores for Pod {selectedMatrixPod}.
      </p>
    </div>
  );
}

// ── Escalation Chain Tab ──

const escalationChains = [
  {
    severity: 'S1' as const,
    label: 'Critical',
    variant: 'error' as const,
    chain: ['Store Manager', 'Cluster Manager', 'POD Head', 'CEO'],
    window: '2h',
  },
  {
    severity: 'S2' as const,
    label: 'High',
    variant: 'warning' as const,
    chain: ['Store Manager', 'Cluster Manager', 'POD Head'],
    window: '8h',
  },
  {
    severity: 'S3' as const,
    label: 'Medium',
    variant: 'default' as const,
    chain: ['Store Manager', 'Cluster Manager'],
    window: '24h',
  },
  {
    severity: 'S4' as const,
    label: 'Low',
    variant: 'outline' as const,
    chain: ['Store Manager'],
    window: '48h',
  },
];

const escalationRules = [
  { severity: 'S1', initialOwner: 'Store Manager', autoEscalateAfter: '30 min', escalateTo: 'Cluster Manager', maxEscalations: 3, notificationChannel: 'Push + SMS + Email' },
  { severity: 'S2', initialOwner: 'Store Manager', autoEscalateAfter: '2h', escalateTo: 'Cluster Manager', maxEscalations: 2, notificationChannel: 'Push + Email' },
  { severity: 'S3', initialOwner: 'Store Manager', autoEscalateAfter: '8h', escalateTo: 'Cluster Manager', maxEscalations: 1, notificationChannel: 'In-App + Email' },
  { severity: 'S4', initialOwner: 'Store Manager', autoEscalateAfter: '24h', escalateTo: 'N/A', maxEscalations: 0, notificationChannel: 'In-App only' },
];

function EscalationChainTab() {
  return (
    <div className="space-y-4">
      {/* Escalation Chain Diagrams */}
      <div className="grid grid-cols-1 gap-3">
        {escalationChains.map((esc) => (
          <div key={esc.severity} className="bg-white rounded-lg border border-gray-200 p-4">
            <SectionHeader
              title={<Badge variant={esc.variant}>{esc.severity} — {esc.label}</Badge>}
              actions={<span className="text-xs text-gray-500">Escalation window: <span className="font-semibold text-gray-700">{esc.window}</span></span>}
            />
            <div className="flex items-center gap-2 flex-wrap">
              {esc.chain.map((role, idx) => (
                <div key={role} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{role}</span>
                  </div>
                  {idx < esc.chain.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Escalation Rules Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Escalation Rules" />
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Severity</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Initial Owner</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Auto-Escalate After</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Escalate To</th>
              <th className="text-center text-xs font-medium text-gray-500 pb-2">Max Escalations</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-2">Notification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {escalationRules.map((rule) => (
              <tr key={rule.severity}>
                <td className="py-2.5 text-sm font-medium text-gray-900">{rule.severity}</td>
                <td className="py-2.5 text-sm text-gray-700">{rule.initialOwner}</td>
                <td className="py-2.5 text-sm text-gray-700">{rule.autoEscalateAfter}</td>
                <td className="py-2.5 text-sm text-gray-700">{rule.escalateTo}</td>
                <td className="py-2.5 text-sm text-center text-gray-700">{rule.maxEscalations}</td>
                <td className="py-2.5 text-sm text-gray-600">{rule.notificationChannel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminGroupsPage() {
  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">User Management is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader
        title="Groups & Pods"
        actions={
          <Button size="sm" variant="outline">
            <Building2 className="w-4 h-4 mr-1.5" />
            Export Matrix
          </Button>
        }
      />

      {/* Summary Cards */}
      <MetricGrid columns={4}>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-gray-500">Functional Groups</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{functionalGroups.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-secondary" />
            <span className="text-xs text-gray-500">Product Pods</span>
          </div>
          <p className="text-xl font-bold text-gray-900">24</p>
          <p className="text-xs text-gray-500">{'\u20B9'}{productPodTotal.toLocaleString('en-IN')} Cr target</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-success" />
            <span className="text-xs text-gray-500">Operations Pods</span>
          </div>
          <p className="text-xl font-bold text-gray-900">10</p>
          <p className="text-xs text-gray-500">{operationsPodTotal.stores.toLocaleString('en-IN')} stores</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Grid3X3 className="w-4 h-4 text-warning" />
            <span className="text-xs text-gray-500">Matrix Coverage</span>
          </div>
          <p className="text-xl font-bold text-gray-900">100%</p>
          <p className="text-xs text-gray-500">All stores mapped</p>
        </div>
      </MetricGrid>

      {/* Tabs */}
      <Tabs defaultValue="functional">
        <TabsList>
          <TabsTrigger value="functional">Functional Groups</TabsTrigger>
          <TabsTrigger value="product">Product Pods (24)</TabsTrigger>
          <TabsTrigger value="operations">Operations Pods (10)</TabsTrigger>
          <TabsTrigger value="matrix">Store-to-Pod Matrix</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Chains</TabsTrigger>
        </TabsList>

        <TabsContent value="functional">
          <FunctionalGroupsTab />
        </TabsContent>

        <TabsContent value="product">
          <ProductPodsTab />
        </TabsContent>

        <TabsContent value="operations">
          <OperationsPodsTab />
        </TabsContent>

        <TabsContent value="matrix">
          <StoreToPodMatrixTab />
        </TabsContent>

        <TabsContent value="escalation">
          <EscalationChainTab />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
