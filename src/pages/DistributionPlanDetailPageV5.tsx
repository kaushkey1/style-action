/* eslint-disable design-system/prefer-section-header */
import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  EmptyState,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  MetricGrid,
  MetricCard,
  FilterBar,
  FilterSearch,
  FilterSelect,
  Input,
} from '@/components/ui';
import {
  ArrowLeft,
  TruckIcon,
  Store,
  Package,
  Download,
  FileSpreadsheet,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import {
  mockDistributionPlans,
  getStatusBadgeConfig,
} from '@/data/mockDistributionPlan';

// Generate allocation data matching the image format
interface AllocationRow {
  season: string;
  hit: string;
  styleId: string;
  variantArticleNumber: string;
  purchaseGroup: string;
  deliveryDate: string;
  storeCode: string;
  qty: number;
  uom: string;
  otbNumber: string;
  mrp: number;
  priority: string;
  seasonYear: number;
}

function generateAllocations(): AllocationRow[] {
  const allocations: AllocationRow[] = [];

  // Sample SKUs matching the image format
  const skus = [
    { styleId: 'TAW25CWEWAM0015', variants: ['443060504009', '443060504008', '443060504007', '443060504006'] },
    { styleId: 'TAW25CWEWAM0016', variants: ['443060505001', '443060505002', '443060505003', '443060505004'] },
    { styleId: 'TAW25CWEWAM0017', variants: ['443060506001', '443060506002', '443060506003', '443060506004'] },
    { styleId: 'TAW25CWEWAM0018', variants: ['443060507001', '443060507002', '443060507003', '443060507004'] },
    { styleId: 'TAW25CWEWAM0019', variants: ['443060508001', '443060508002', '443060508003', '443060508004'] },
    { styleId: 'TAW25CWEWAM0020', variants: ['443060509001', '443060509002', '443060509003', '443060509004'] },
  ];

  // Store codes from mock data
  const stores = [
    'RAK0', 'R300', 'R400', 'R500', 'R600', 'R700',
    'R101', 'R102', 'R103', 'R104', 'R105', 'R106',
    'R201', 'R202', 'R203', 'R204', 'R205', 'R206',
    'R301', 'R302', 'R303', 'R304', 'R305', 'R306',
  ];

  const purchaseGroups = ['K42', 'K43', 'K44', 'K45', 'K46'];
  const seasons = ['APAW', 'APSS', 'APSR'];
  const hits = ['H1', 'H2', 'H3'];
  const priorities = ['P1', 'P2', 'P3'];

  skus.forEach(sku => {
    sku.variants.forEach(variant => {
      // Generate allocations for multiple stores per variant
      const storeCount = Math.floor(Math.random() * 8) + 4; // 4-12 stores per variant
      const selectedStores = stores.sort(() => 0.5 - Math.random()).slice(0, storeCount);

      selectedStores.forEach(storeCode => {
        allocations.push({
          season: seasons[Math.floor(Math.random() * seasons.length)] || 'APAW',
          hit: hits[Math.floor(Math.random() * hits.length)] || 'H1',
          styleId: sku.styleId,
          variantArticleNumber: variant,
          purchaseGroup: purchaseGroups[Math.floor(Math.random() * purchaseGroups.length)] || 'K42',
          deliveryDate: '28.10.2025',
          storeCode: storeCode,
          qty: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
          uom: 'EA',
          otbNumber: `J588340014APSP203210${purchaseGroups[Math.floor(Math.random() * purchaseGroups.length)] || 'K42'}`,
          mrp: 1000 + Math.floor(Math.random() * 2000), // 1000-3000
          priority: priorities[Math.floor(Math.random() * priorities.length)] || 'P1',
          seasonYear: 2025,
        });
      });
    });
  });

  return allocations;
}

export function DistributionPlanDetailPageV5() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [skuFilter, setSkuFilter] = useState('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAllocations, setEditedAllocations] = useState<AllocationRow[]>([]);

  const plan = mockDistributionPlans.find(p => p.id === id);
  const initialAllocations = useMemo(() => generateAllocations(), []);

  if (!plan) {
    return (
      <EmptyState
        description="The requested distribution plan could not be found"
        action={
          <Button onClick={() => navigate('/distribution-plans')} variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Button>
        }
      />
    );
  }
  const allocations = isEditMode && editedAllocations.length > 0 ? editedAllocations : initialAllocations;

  // Get unique values for filters
  const uniqueStores = Array.from(new Set(allocations.map(a => a.storeCode))).sort();
  const uniqueSkus = Array.from(new Set(allocations.map(a => a.styleId))).sort();

  // Filter allocations
  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = searchTerm === '' ||
      allocation.styleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.variantArticleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.storeCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStore = storeFilter === 'all' || allocation.storeCode === storeFilter;
    const matchesSku = skuFilter === 'all' || allocation.styleId === skuFilter;

    return matchesSearch && matchesStore && matchesSku;
  });

  // Calculate summary metrics
  const totalQuantity = filteredAllocations.reduce((sum, a) => sum + a.qty, 0);
  const uniqueStoresCount = new Set(filteredAllocations.map(a => a.storeCode)).size;
  const uniqueSkusCount = new Set(filteredAllocations.map(a => a.styleId)).size;
  const totalValue = filteredAllocations.reduce((sum, a) => sum + (a.qty * a.mrp), 0);

  const statusConfig = getStatusBadgeConfig(plan.status);
  const isApproved = plan.status === 'approved';

  // Edit mode handlers
  const handleEnterEditMode = () => {
    setEditedAllocations([...allocations]);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditedAllocations([]);
    setIsEditMode(false);
  };

  const handleSaveEdit = () => {
    // In a real app, this would save to backend
    console.log('Saving edited allocations:', editedAllocations);
    setIsEditMode(false);
    // Keep the edited allocations as the current state
  };

  const handleQuantityChange = (allocation: AllocationRow, newQty: string) => {
    const qty = parseInt(newQty) || 0;
    if (qty >= 0) {
      const updated = editedAllocations.map(a => {
        if (a.storeCode === allocation.storeCode &&
            a.variantArticleNumber === allocation.variantArticleNumber &&
            a.styleId === allocation.styleId) {
          return { ...a, qty };
        }
        return a;
      });
      setEditedAllocations(updated);
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={plan.name}
        backTo={{ label: 'Distribution Plans', path: '/distribution-plans' }}
        badges={
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <>
                {!isApproved && (
                  <Button variant="primary" onClick={handleEnterEditMode}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit Quantities
                  </Button>
                )}
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  Download Template
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          icon={Package}
          label="Total SKUs"
          value={uniqueSkusCount.toString()}
        />
        <MetricCard
          icon={Store}
          label="Stores Covered"
          value={uniqueStoresCount.toString()}
        />
        <MetricCard
          icon={Package}
          label="Total Units"
          value={totalQuantity.toLocaleString()}
        />
        <MetricCard
          icon={TruckIcon}
          label="Total Value"
          value={`₹${(totalValue / 100000).toFixed(1)} L`}
        />
      </MetricGrid>

      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Allocation Details</h3>
              {isEditMode && (
                <Badge variant="warning" size="sm">
                  Edit Mode
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {filteredAllocations.length} rows
            </div>
          </div>

          <FilterBar>
            <FilterSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by SKU, Store, or Variant..."
            />
            <FilterSelect
              value={storeFilter}
              onChange={setStoreFilter}
              placeholder="All Stores"
              options={[
                { value: 'all', label: 'All Stores' },
                ...uniqueStores.map(store => ({ value: store, label: store }))
              ]}
            />
            <FilterSelect
              value={skuFilter}
              onChange={setSkuFilter}
              placeholder="All SKUs"
              options={[
                { value: 'all', label: 'All SKUs' },
                ...uniqueSkus.map(sku => ({ value: sku, label: sku }))
              ]}
            />
          </FilterBar>

          {filteredAllocations.length === 0 ? (
            <EmptyState
              description="No allocations match your filters"
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <DataTable>
                <DataTableHeader>
                  <DataTableHead>Season</DataTableHead>
                  <DataTableHead>Hit</DataTableHead>
                  <DataTableHead>Style Id</DataTableHead>
                  <DataTableHead>Variant Article Number</DataTableHead>
                  <DataTableHead>Purchase Group</DataTableHead>
                  <DataTableHead>Delivery Date</DataTableHead>
                  <DataTableHead>Store Code</DataTableHead>
                  <DataTableHead align="right">Qty</DataTableHead>
                  <DataTableHead>UOM</DataTableHead>
                  <DataTableHead>OTB Number</DataTableHead>
                  <DataTableHead align="right">MRP</DataTableHead>
                  <DataTableHead>Priority</DataTableHead>
                  <DataTableHead align="right">Season Year</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {filteredAllocations.slice(0, 100).map((allocation, index) => (
                    <DataTableRow key={`${allocation.storeCode}-${allocation.variantArticleNumber}-${index}`}>
                      <DataTableCell className="font-medium">{allocation.season}</DataTableCell>
                      <DataTableCell>{allocation.hit}</DataTableCell>
                      <DataTableCell className="font-mono text-xs">{allocation.styleId}</DataTableCell>
                      <DataTableCell className="font-mono text-xs">{allocation.variantArticleNumber}</DataTableCell>
                      <DataTableCell>{allocation.purchaseGroup}</DataTableCell>
                      <DataTableCell>{allocation.deliveryDate}</DataTableCell>
                      <DataTableCell className="font-medium">{allocation.storeCode}</DataTableCell>
                      <DataTableCell align="right">
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={allocation.qty.toString()}
                            onChange={(e) => handleQuantityChange(allocation, e.target.value)}
                            className="w-16 text-right h-7 text-xs"
                            min="0"
                          />
                        ) : (
                          allocation.qty
                        )}
                      </DataTableCell>
                      <DataTableCell>{allocation.uom}</DataTableCell>
                      <DataTableCell className="font-mono text-xs">{allocation.otbNumber}</DataTableCell>
                      <DataTableCell align="right">{allocation.mrp}</DataTableCell>
                      <DataTableCell>
                        <Badge variant={allocation.priority === 'P1' ? 'default' : 'outline'} size="sm">
                          {allocation.priority}
                        </Badge>
                      </DataTableCell>
                      <DataTableCell align="right">{allocation.seasonYear}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
              {filteredAllocations.length > 100 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  Showing first 100 rows of {filteredAllocations.length} total
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}