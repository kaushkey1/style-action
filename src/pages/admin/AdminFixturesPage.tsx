import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Info,
} from 'lucide-react';
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Pagination,
  usePagination,
  PageHeader,
  SectionHeader,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  storeSpaceProfiles,
  fixtureTypesOM,
  spaceNormStandards,
  floorCodes,
  segmentCodes,
  type SpaceNormStandard,
} from '@/data/mockSpacePlanning';

// ── Tab 1: Fixture Types (Operating Model) ──

function FixtureTypesTab() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = fixtureTypesOM.filter((ft) => {
    const matchesSearch = !search ||
      ft.name.toLowerCase().includes(search.toLowerCase()) ||
      ft.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ft.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(fixtureTypesOM.map(ft => ft.category))];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search fixture types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 h-9"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                categoryFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  categoryFilter === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Fixture Type
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Code</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Category</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Options</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Size Set</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Qty/Fixture</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">LFT</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Display Method</th>
              <th className="text-center text-xs font-medium text-gray-500 pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ft) => (
              <tr key={ft.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{ft.name}</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-gray-600 font-mono">{ft.code}</td>
                <td className="py-3">
                  <Badge variant="default" size="sm">{ft.category}</Badge>
                </td>
                <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{ft.optionCapacity}</td>
                <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{ft.sizeSet}</td>
                <td className="py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">{ft.quantityPerFixture}</td>
                <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{ft.linearFeet}</td>
                <td className="py-3 text-sm text-gray-600">{ft.displayMethod}</td>
                <td className="py-3 text-center">
                  <Badge
                    variant={ft.status === 'Active' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {ft.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="py-3 text-sm font-semibold text-gray-900">
                {filtered.length} fixture type{filtered.length !== 1 ? 's' : ''}
              </td>
              <td className="py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                {filtered.reduce((sum, ft) => sum + ft.optionCapacity, 0)}
              </td>
              <td />
              <td className="py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                {filtered.reduce((sum, ft) => sum + ft.quantityPerFixture, 0)}
              </td>
              <td className="py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                {filtered.reduce((sum, ft) => sum + ft.linearFeet, 0)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No fixture types match your search.</p>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Store Assignments (with Brand Fixture drilldown) ──

interface StoreFixtureAssignment {
  storeId: string;
  storeName: string;
  city: string;
  grade: string;
  totalFixtures: number;
  wallBay: number;
  aRail: number;
  nestedTable: number;
  other: number;
  utilization: number;
  categoryIds: string[];
  categories: {
    id: string;
    name: string;
    wallBay: number;
    aRail: number;
    nestedTable: number;
    other: number;
    utilization: number;
  }[];
}

const categoryNames: Record<string, string> = {
  'mens-casual': 'Mens Casual',
  'mens-formal': 'Mens Formal',
  'womens-ethnic': 'Womens Ethnic',
  'womens-western': 'Womens Western',
  'kids-wear': 'Kids Wear',
};

const brandFixtureData: Record<string, { name: string; brands: { name: string; base: number; wallBay: number; aRail: number; nested: number }[] }> = {
  'mens-casual': {
    name: 'Mens Casual',
    brands: [
      { name: 'DNNK Mens Casual', base: 280, wallBay: 12, aRail: 6, nested: 2 },
      { name: 'Teamsport MC', base: 195, wallBay: 8, aRail: 4, nested: 1 },
      { name: 'Performax MC', base: 160, wallBay: 6, aRail: 3, nested: 1 },
      { name: 'Lee Cooper MC', base: 220, wallBay: 10, aRail: 5, nested: 2 },
      { name: 'John Players Jeans', base: 145, wallBay: 5, aRail: 2, nested: 0 },
    ],
  },
  'mens-formal': {
    name: 'Mens Formal',
    brands: [
      { name: 'Van Heusen', base: 310, wallBay: 14, aRail: 5, nested: 3 },
      { name: 'Louis Philippe', base: 275, wallBay: 12, aRail: 4, nested: 2 },
      { name: 'Arrow', base: 200, wallBay: 8, aRail: 3, nested: 1 },
      { name: 'Peter England', base: 185, wallBay: 7, aRail: 4, nested: 1 },
      { name: 'Blackberrys', base: 150, wallBay: 6, aRail: 2, nested: 0 },
    ],
  },
  'womens-ethnic': {
    name: 'Womens Ethnic',
    brands: [
      { name: 'Biba', base: 340, wallBay: 15, aRail: 6, nested: 3 },
      { name: 'W', base: 290, wallBay: 12, aRail: 5, nested: 2 },
      { name: 'Aurelia', base: 210, wallBay: 9, aRail: 4, nested: 2 },
      { name: 'Global Desi', base: 180, wallBay: 7, aRail: 3, nested: 1 },
      { name: 'Soch', base: 155, wallBay: 6, aRail: 2, nested: 1 },
    ],
  },
  'womens-western': {
    name: 'Womens Western',
    brands: [
      { name: 'Vero Moda', base: 260, wallBay: 11, aRail: 6, nested: 2 },
      { name: 'Only', base: 230, wallBay: 10, aRail: 5, nested: 2 },
      { name: 'AND', base: 175, wallBay: 7, aRail: 3, nested: 1 },
      { name: 'Forever 21', base: 200, wallBay: 8, aRail: 4, nested: 1 },
      { name: 'H&M', base: 320, wallBay: 14, aRail: 7, nested: 3 },
    ],
  },
  'kids-wear': {
    name: 'Kids Wear',
    brands: [
      { name: 'Allen Solly Junior', base: 180, wallBay: 8, aRail: 3, nested: 2 },
      { name: 'US Polo Kids', base: 165, wallBay: 7, aRail: 3, nested: 1 },
      { name: 'Mothercare', base: 210, wallBay: 9, aRail: 4, nested: 2 },
      { name: 'Gini & Jony', base: 130, wallBay: 5, aRail: 2, nested: 1 },
      { name: 'Lilliput', base: 110, wallBay: 4, aRail: 2, nested: 0 },
    ],
  },
};

const GRADE_OPTIONS = ['All', 'A+', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;

function StoreAssignmentsTab() {
  const stores = useMemo(() => storeSpaceProfiles.map((p) => ({
    id: p.storeId,
    name: p.storeName,
    city: p.city,
    grade: p.grade,
    sqft: p.carpetArea,
    score: p.saleableRatio * 100,
    categories: segmentCodes.map((s) => s.code),
  })), []);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [expandedCategoryKey, setExpandedCategoryKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const assignments: StoreFixtureAssignment[] = useMemo(() => stores.map((store) => {
    const wallBay = 20 + Math.round((store.sqft / 1000) * 3);
    const aRail = 8 + Math.round((store.sqft / 1000) * 1.5);
    const nestedTable = 2 + Math.round((store.sqft / 1000) * 0.5);
    const other = 4 + Math.round((store.sqft / 1000) * 0.8);
    const utilization = 65 + Math.round((store.score / 100) * 25);

    const categories = store.categories.map((catId) => ({
      id: catId,
      name: categoryNames[catId] || catId,
      wallBay: Math.round(wallBay / store.categories.length) + Math.round(Math.random() * 4),
      aRail: Math.round(aRail / store.categories.length) + Math.round(Math.random() * 2),
      nestedTable: Math.round(nestedTable / store.categories.length),
      other: Math.round(other / store.categories.length),
      utilization: 55 + Math.round(Math.random() * 35),
    }));

    return {
      storeId: store.id,
      storeName: store.name,
      city: store.city,
      grade: store.grade,
      totalFixtures: wallBay + aRail + nestedTable + other,
      wallBay,
      aRail,
      nestedTable,
      other,
      utilization,
      categoryIds: store.categories,
      categories,
    };
  }), [stores]);

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = assignments;
    if (q) {
      result = result.filter(a => a.storeName.toLowerCase().includes(q) || a.city.toLowerCase().includes(q));
    }
    if (gradeFilter !== 'All') {
      result = result.filter(a => a.grade === gradeFilter);
    }
    return result;
  }, [assignments, searchQuery, gradeFilter]);

  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(filteredAssignments, 25);
  const pageItems = getPageItems(currentPage);

  // Reset page and expanded state when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setExpandedStoreId(null);
    setExpandedCategoryKey(null);
  };

  const handleGradeChange = (grade: string) => {
    setGradeFilter(grade);
    setCurrentPage(1);
    setExpandedStoreId(null);
    setExpandedCategoryKey(null);
  };

  const utilizationColor = (u: number) =>
    u >= 80 ? 'bg-success' : u >= 60 ? 'bg-warning' : 'bg-error';

  const handleCategoryClick = (storeId: string, catId: string) => {
    const key = `${storeId}:${catId}`;
    setExpandedCategoryKey(expandedCategoryKey === key ? null : key);
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <Input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full h-8"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Grade</span>
          {GRADE_OPTIONS.map(g => (
            <button
              key={g}
              onClick={() => handleGradeChange(g)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                gradeFilter === g
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {g}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          {filteredAssignments.length} of {assignments.length} stores
        </span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No stores match your search</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-3 w-8" />
                  <th className="text-left text-xs font-medium text-gray-500 pb-3">Store</th>
                  <th className="text-center text-xs font-medium text-gray-500 pb-3">Grade</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Total</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Wall Bay</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">A-Rail</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Nesting Table</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3">Other</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-3 w-36">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => {
                  const isExpanded = expandedStoreId === a.storeId;
                  return (
                    <RowGroup key={a.storeId}>
                      <tr
                        className={cn(
                          'border-b border-gray-50 cursor-pointer transition-colors',
                          isExpanded ? 'bg-primary/5' : 'hover:bg-gray-50'
                        )}
                        onClick={() => {
                          setExpandedStoreId(isExpanded ? null : a.storeId);
                          if (isExpanded) setExpandedCategoryKey(null);
                        }}
                      >
                        <td className="py-3">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-primary" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </td>
                        <td className="py-3 text-sm font-medium text-gray-900">{a.storeName}</td>
                        <td className="py-3 text-center">
                          <Badge
                            variant={a.grade.startsWith('A') ? 'success' : 'default'}
                            size="sm"
                          >
                            {a.grade}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">{a.totalFixtures}</td>
                        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{a.wallBay}</td>
                        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{a.aRail}</td>
                        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{a.nestedTable}</td>
                        <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{a.other}</td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              { }
                              <div
                                className={`h-full rounded-full ${utilizationColor(a.utilization)}`}
                                // eslint-disable-next-line no-restricted-syntax -- dynamic width
                                style={{ width: `${a.utilization}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 tabular-nums w-8 text-right">{a.utilization}%</span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <>
                          {a.categories.map((cat) => {
                            const catKey = `${a.storeId}:${cat.id}`;
                            const isCatExpanded = expandedCategoryKey === catKey;
                            const brands = brandFixtureData[cat.id]?.brands || [];
                            return (
                              <RowGroup key={cat.id}>
                                <tr
                                  className={cn(
                                    'border-b border-gray-50 cursor-pointer transition-colors',
                                    isCatExpanded ? 'bg-blue-50/60' : 'bg-gray-50/80 hover:bg-gray-100/60'
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryClick(a.storeId, cat.id);
                                  }}
                                >
                                  <td className="py-2 pl-2">
                                    {brands.length > 0 && (
                                      isCatExpanded
                                        ? <ChevronDown className="w-3 h-3 text-blue-500" />
                                        : <ChevronRight className="w-3 h-3 text-gray-400" />
                                    )}
                                  </td>
                                  <td className="py-2 pl-4 text-xs font-medium text-gray-700">{cat.name}</td>
                                  <td />
                                  <td className="py-2 text-xs text-gray-500 text-right tabular-nums">
                                    {cat.wallBay + cat.aRail + cat.nestedTable + cat.other}
                                  </td>
                                  <td className="py-2 text-xs text-gray-500 text-right tabular-nums">{cat.wallBay}</td>
                                  <td className="py-2 text-xs text-gray-500 text-right tabular-nums">{cat.aRail}</td>
                                  <td className="py-2 text-xs text-gray-500 text-right tabular-nums">{cat.nestedTable}</td>
                                  <td className="py-2 text-xs text-gray-500 text-right tabular-nums">{cat.other}</td>
                                  <td className="py-2">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        { }
                                        <div
                                          className={`h-full rounded-full ${utilizationColor(cat.utilization)}`}
                                          // eslint-disable-next-line no-restricted-syntax -- dynamic width
                                          style={{ width: `${cat.utilization}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-medium text-gray-500 tabular-nums w-8 text-right">{cat.utilization}%</span>
                                    </div>
                                  </td>
                                </tr>
                                {isCatExpanded && brands.length > 0 && (
                                  <tr>
                                    <td colSpan={9} className="p-0">
                                      <div className="bg-blue-50/40 border-l-2 border-blue-300 ml-6 mr-2 my-1 rounded-r-lg">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="border-b border-blue-100/50">
                                              <th className="text-left text-[10px] font-medium text-blue-600/80 py-1.5 px-3">Brand</th>
                                              <th className="text-right text-[10px] font-medium text-blue-600/80 py-1.5 px-3">Options</th>
                                              <th className="text-right text-[10px] font-medium text-blue-600/80 py-1.5 px-3">WB</th>
                                              <th className="text-right text-[10px] font-medium text-blue-600/80 py-1.5 px-3">AR</th>
                                              <th className="text-right text-[10px] font-medium text-blue-600/80 py-1.5 px-3">NT</th>
                                              <th className="text-right text-[10px] font-medium text-blue-600/80 py-1.5 px-3">Total</th>
                                              <th className="text-left text-[10px] font-medium text-blue-600/80 py-1.5 px-3 w-28">Mix</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {brands.map((brand) => {
                                              const totalFix = brand.wallBay + brand.aRail + brand.nested;
                                              const wPct = totalFix > 0 ? Math.round((brand.wallBay / totalFix) * 100) : 0;
                                              const aPct = totalFix > 0 ? Math.round((brand.aRail / totalFix) * 100) : 0;
                                              const nPct = totalFix > 0 ? 100 - wPct - aPct : 0;
                                              return (
                                                <tr key={brand.name} className="border-b border-blue-100/30">
                                                  <td className="py-1.5 px-3 text-xs text-gray-800">{brand.name}</td>
                                                  <td className="py-1.5 px-3 text-xs text-gray-600 text-right tabular-nums">{brand.base}</td>
                                                  <td className="py-1.5 px-3 text-xs text-gray-600 text-right tabular-nums">{brand.wallBay}</td>
                                                  <td className="py-1.5 px-3 text-xs text-gray-600 text-right tabular-nums">{brand.aRail}</td>
                                                  <td className="py-1.5 px-3 text-xs text-gray-600 text-right tabular-nums">{brand.nested}</td>
                                                  <td className="py-1.5 px-3 text-xs font-semibold text-gray-800 text-right tabular-nums">{totalFix}</td>
                                                  <td className="py-1.5 px-3">
                                                    {totalFix > 0 ? (
                                                      <div className="flex h-2 rounded overflow-hidden">
                                                        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
                                                        <div className="bg-primary" style={{ width: `${wPct}%` }} />
                                                        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
                                                        <div className="bg-blue-500" style={{ width: `${aPct}%` }} />
                                                        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
                                                        <div className="bg-gray-400" style={{ width: `${nPct}%` }} />
                                                      </div>
                                                    ) : (
                                                      <span className="text-[10px] text-gray-400">-</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                          <tfoot>
                                            <tr className="border-t border-blue-200/50">
                                              <td className="py-1.5 px-3 text-xs font-semibold text-gray-700">
                                                {brands.length} brands
                                              </td>
                                              <td className="py-1.5 px-3 text-xs font-semibold text-gray-700 text-right tabular-nums">
                                                {brands.reduce((s, b) => s + b.base, 0)}
                                              </td>
                                              <td className="py-1.5 px-3 text-xs font-semibold text-gray-700 text-right tabular-nums">
                                                {brands.reduce((s, b) => s + b.wallBay, 0)}
                                              </td>
                                              <td className="py-1.5 px-3 text-xs font-semibold text-gray-700 text-right tabular-nums">
                                                {brands.reduce((s, b) => s + b.aRail, 0)}
                                              </td>
                                              <td className="py-1.5 px-3 text-xs font-semibold text-gray-700 text-right tabular-nums">
                                                {brands.reduce((s, b) => s + b.nested, 0)}
                                              </td>
                                              <td className="py-1.5 px-3 text-xs font-bold text-gray-700 text-right tabular-nums">
                                                {brands.reduce((s, b) => s + b.wallBay + b.aRail + b.nested, 0)}
                                              </td>
                                              <td className="py-1.5 px-3">
                                                <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-primary rounded-sm" />WB</span>
                                                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />AR</span>
                                                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-gray-400 rounded-sm" />NT</span>
                                                </div>
                                              </td>
                                            </tr>
                                          </tfoot>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </RowGroup>
                            );
                          })}
                        </>
                      )}
                    </RowGroup>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ── Tab 4: Fixture Coding ──

function FixtureCodingTab() {
  return (
    <div className="space-y-4">
      {/* Coding Convention */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Fixture Coding Convention</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm text-gray-800">
          <p className="font-semibold">[STORE CODE]-[FLOOR]-[SEGMENT]-[FIXTURE TYPE]-[SEQ#]</p>
          <p className="text-gray-500 mt-1">Example: TX72-GF-MW-4WAY-003</p>
        </div>
      </div>

      {/* Floor Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Floor Codes" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Code</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {floorCodes.map((fc) => (
              <tr key={fc.code} className="border-b border-gray-50">
                <td className="py-2.5 text-sm font-mono font-medium text-gray-900">{fc.code}</td>
                <td className="py-2.5 text-sm text-gray-700">{fc.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Segment Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Segment Codes" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Code</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {segmentCodes.map((sc) => (
              <tr key={sc.code} className="border-b border-gray-50">
                <td className="py-2.5 text-sm font-mono font-medium text-gray-900">{sc.code}</td>
                <td className="py-2.5 text-sm text-gray-700">{sc.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixture Type Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Fixture Type Codes" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Code</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Fixture Type</th>
            </tr>
          </thead>
          <tbody>
            {fixtureTypesOM.filter(ft => ft.status === 'Active').map((ft) => (
              <tr key={ft.id} className="border-b border-gray-50">
                <td className="py-2.5 text-sm font-mono font-medium text-gray-900">{ft.code}</td>
                <td className="py-2.5 text-sm text-gray-700">{ft.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 5: Space Norms ──

function SpaceNormsTab() {
  const [norms, setNorms] = useState<SpaceNormStandard[]>(spaceNormStandards);

  const handleValueChange = (id: string, newValue: string) => {
    const parsed = parseFloat(newValue);
    if (isNaN(parsed)) return;
    setNorms((prev) =>
      prev.map((n) => (n.id === id ? { ...n, value: parsed } : n))
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Space Norm Standards" actions={<Badge variant="default" size="sm">Editable</Badge>} className="mb-4" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Rule</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3 w-32">Value</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3 w-16">Unit</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {norms.map((norm) => (
              <tr key={norm.id} className="border-b border-gray-50">
                <td className="py-3 text-sm font-medium text-gray-900">{norm.rule}</td>
                <td className="py-3 text-right">
                  <Input
                    type="number"
                    value={norm.value}
                    onChange={(e) => handleValueChange(norm.id, e.target.value)}
                    className="w-24 h-8 text-right text-sm ml-auto"
                  />
                </td>
                <td className="py-3 text-sm text-gray-500 pl-2">{norm.unit}</td>
                <td className="py-3 text-sm text-gray-600">{norm.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminFixturesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Fixture Master" />

      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types">Fixture Types</TabsTrigger>
          <TabsTrigger value="assignments">Store Assignments</TabsTrigger>
          <TabsTrigger value="coding">Fixture Coding</TabsTrigger>
          <TabsTrigger value="space-norms">Space Norms</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <FixtureTypesTab />
        </TabsContent>

        <TabsContent value="assignments">
          <StoreAssignmentsTab />
        </TabsContent>

        <TabsContent value="coding">
          <FixtureCodingTab />
        </TabsContent>

        <TabsContent value="space-norms">
          <SpaceNormsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
