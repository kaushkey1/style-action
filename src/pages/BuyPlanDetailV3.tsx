/* eslint-disable design-system/prefer-metric-grid, design-system/prefer-section-header */
import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  EmptyState,
  MetricGrid,
  MetricCard,
  SectionHeader,
  Modal,
  Switch,
  Input,
} from '@/components/ui';
import {
  ChevronLeft,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Minus,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import {
  mockCategoryBuyPlans,
  mockBrandBuyPlans,
  getBuyPlanStats,
  getOtbUsagePercentage,
  getStatusBadgeConfig,
  getFashionGradeBadgeClass,
  getActiveOptionsCount,
  getTotalQuantity,
  getTotalExpectedRevenue,
  getDesignRevenue,
  type CategoryBuyPlan,
  type BrandBuyPlan,
  type Design,
  type BuyPlanStatus,
} from '@/data/mockBuyPlanV3';
import { cn } from '@/lib/utils';

export function BuyPlanDetailV3() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewType = searchParams.get('view') || 'category';

  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const buyPlan = viewType === 'category'
    ? mockCategoryBuyPlans.find(bp => bp.id === id) as CategoryBuyPlan | undefined
    : mockBrandBuyPlans.find(bp => bp.id === id) as BrandBuyPlan | undefined;

  if (!buyPlan) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title="Buy Plan Not Found"
          backTo={{ label: 'Buy Plans', path: '/buy-plans' }}
        />
        <EmptyState
          description="The requested buy plan could not be found"
          action={
            <Button onClick={() => navigate('/buy-plans')} variant="outline">
              <ChevronLeft className="w-4 h-4" />
              Back to Buy Plans
            </Button>
          }
        />
      </div>
    );
  }

  const stats = getBuyPlanStats(buyPlan);
  const otbUsage = getOtbUsagePercentage(buyPlan);
  const statusConfig = getStatusBadgeConfig(buyPlan.status);

  const totalUnits = buyPlan.designs.reduce((sum, design) =>
    sum + design.colorOptions.reduce((colorSum, opt) =>
      colorSum + (opt.isActive ? opt.quantity : 0), 0
    ), 0
  );

  const hasZeroActiveOptions = buyPlan.designs.some(d => getActiveOptionsCount(d) === 0);
  const hasZeroQuantity = buyPlan.designs.some(d =>
    d.colorOptions.filter(c => c.isActive).some(c => c.quantity === 0)
  );

  const handleSubmitForCosting = () => {
    console.log('Submitting for costing...');
  };

  const handleConfirmBuyPlan = () => {
    console.log('Confirming buy plan...');
  };

  const getPageTitle = () => {
    if (viewType === 'category') {
      const catPlan = buyPlan as CategoryBuyPlan;
      return `${catPlan.pod.name} - ${catPlan.fashionGrade.replace('APL-', '')}`;
    } else {
      const brandPlan = buyPlan as BrandBuyPlan;
      return `${brandPlan.brand} ${brandPlan.family}`;
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={getPageTitle()}
        backTo={{ label: 'Buy Plans', path: '/buy-plans' }}
        badges={
          <>
            <Badge variant={statusConfig.label === 'Draft' ? 'default' : statusConfig.label === 'Approved' ? 'success' : 'warning'}>
              {statusConfig.label}
            </Badge>
            <Badge className={getFashionGradeBadgeClass(buyPlan.fashionGrade)}>
              {buyPlan.fashionGrade.replace('APL-', '')}
            </Badge>
          </>
        }
      />

      <MetricGrid columns={5}>
        <MetricCard
          icon={TrendingUp}
          label="Expected AOP Revenue"
          value={`₹${getTotalExpectedRevenue(buyPlan).toFixed(1)} L`}
        />
        <MetricCard
          icon={Package}
          label="Styles"
          value={stats.totalDesigns.toString()}
        />
        <MetricCard
          icon={DollarSign}
          label="Intake Value"
          value={stats.isEstimate ? 'N/A' : `₹${stats.totalValue.toFixed(1)} L`}
          subtitle={stats.isEstimate ? 'Post-costing only' : undefined}
        />
        <MetricCard
          icon={TrendingUp}
          label="OTB Used"
          value={`${otbUsage.toFixed(0)}%`}
          subtitle={`₹${stats.totalValue.toFixed(1)} L of ₹${buyPlan.otbAllocated} L`}
          status={
            otbUsage < 80 ? 'on-track' :
            otbUsage < 90 ? 'warning' :
            'critical'
          }
        />
        <MetricCard
          icon={Users}
          label="Total Units"
          value={totalUnits.toLocaleString()}
          subtitle="Across all styles"
        />
      </MetricGrid>

      <PipelineStatus status={buyPlan.status} />

      <Card>
        <div className="p-4">
          <SectionHeader
            title={`Options (${buyPlan.designs.length})`}
            subtitle="Each card represents a unique option"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {buyPlan.designs.map(design => (
              <DesignCard
                key={design.id}
                design={design}
                status={buyPlan.status}
                isSelected={selectedDesignId === design.id}
                onClick={() => setSelectedDesignId(design.id)}
              />
            ))}
          </div>
        </div>
      </Card>

      <BuyPlanFooter
        buyPlan={buyPlan}
        onSubmitForCosting={handleSubmitForCosting}
        onConfirmBuyPlan={handleConfirmBuyPlan}
        hasZeroActiveOptions={hasZeroActiveOptions}
        hasZeroQuantity={hasZeroQuantity}
      />

      {selectedDesignId && (
        <OptionDetailPanel
          design={buyPlan.designs.find(d => d.id === selectedDesignId)!}
          onClose={() => setSelectedDesignId(null)}
          status={buyPlan.status}
        />
      )}
    </div>
  );
}

function PipelineStatus({ status }: { status: BuyPlanStatus }) {
  const stages = [
    { key: 'range_building', label: 'Range Building', states: ['draft'], icon: Package },
    { key: 'costing', label: 'Costing', states: ['pending_costing', 'costing_received'], icon: DollarSign },
    { key: 'approval', label: 'Approval', states: ['confirmed', 'approved'], icon: CheckCircle }
  ];

  const getStageStatus = (stage: typeof stages[0]) => {
    if (stage.states.includes(status)) {
      if (status === 'pending_costing') return 'waiting';
      return 'active';
    }
    const currentIndex = stages.findIndex(s => s.states.includes(status));
    const stageIndex = stages.indexOf(stage);
    return stageIndex < currentIndex ? 'complete' : 'inactive';
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage);
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    stageStatus === 'complete' ? 'bg-green-100' :
                    stageStatus === 'active' ? 'bg-primary' :
                    stageStatus === 'waiting' ? 'bg-primary/10 animate-pulse' :
                    'bg-gray-100'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      stageStatus === 'complete' ? 'text-green-600' :
                      stageStatus === 'active' ? 'text-white' :
                      stageStatus === 'waiting' ? 'text-primary' :
                      'text-gray-400'
                    )} />
                  </div>
                  <p className={cn(
                    'text-xs font-medium mt-1',
                    stageStatus === 'inactive' ? 'text-gray-400' : 'text-gray-700'
                  )}>
                    {stage.label}
                  </p>
                </div>
                {index < stages.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    stageStatus === 'complete' ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function DesignCard({
  design,
  status,
  isSelected,
  onClick
}: {
  design: Design;
  status: BuyPlanStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  const activeOptions = getActiveOptionsCount(design);
  const totalQty = getTotalQuantity(design);
  const isPreCosting = status === 'draft' || status === 'pending_costing';
  const isPendingCosting = status === 'pending_costing';

  const getMarginIndicator = (margin: number | undefined) => {
    if (!margin) return null;
    if (margin >= 52.5) return { color: 'text-green-700' };
    if (margin >= 48) return { color: 'text-amber-700' };
    return { color: 'text-red-700' };
  };

  const marginIndicator = getMarginIndicator(design.avgMargin);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border overflow-hidden cursor-pointer transition-all duration-200',
        'hover:border-primary/30 hover:shadow-md',
        isSelected ? 'ring-2 ring-primary' : 'border-gray-200',
        activeOptions === 0 && 'border-red-300'
      )}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
    >
      <div className="relative h-24 bg-gray-100">
        <img
          src={design.imageUrl}
          alt={design.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 right-1">
          <span className="px-1.5 py-0.5 text-xs font-medium bg-white/90 rounded">
            {design.styleCode}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div>
          <p className="text-xs font-semibold text-gray-900 line-clamp-1">
            {design.name}
          </p>
          <p className="text-xs text-gray-500">
            {design.brand}
          </p>
        </div>

        <div className="flex gap-1">
          {design.colorOptions.slice(0, 5).map(option => {
            const colorClass = option.hexCode === '#FFFFFF' ? 'bg-white' :
                              option.hexCode === '#000000' ? 'bg-black' :
                              option.hexCode === '#FF0000' ? 'bg-red-500' :
                              option.hexCode === '#00FF00' ? 'bg-green-500' :
                              option.hexCode === '#0000FF' ? 'bg-blue-500' :
                              option.hexCode === '#FFFF00' ? 'bg-yellow-400' :
                              option.hexCode === '#FF00FF' ? 'bg-purple-500' :
                              option.hexCode === '#00FFFF' ? 'bg-cyan-500' :
                              option.hexCode === '#FFA500' ? 'bg-orange-500' :
                              option.hexCode === '#808080' ? 'bg-gray-500' :
                              'bg-gray-400';
            return (
              <div
                key={option.color}
                className={cn(
                  'w-3 h-3 rounded-full border',
                  colorClass,
                  option.isActive ? 'border-gray-400' : 'border-gray-200 opacity-40'
                )}
                title={option.color}
              />
            );
          })}
          {design.colorOptions.length > 5 && (
            <span className="text-xs text-gray-400">+{design.colorOptions.length - 5}</span>
          )}
        </div>

        {isPendingCosting ? (
          <div className="bg-primary/10 rounded px-2 py-1">
            <p className="text-xs text-primary flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" />
              Costing...
            </p>
          </div>
        ) : (
          <div className="text-xs space-y-1">
            {isPreCosting ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">ASP</span>
                  <span className="font-semibold text-gray-900">₹{design.asp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Revenue</span>
                  <span className="font-semibold text-primary">
                    ₹{getDesignRevenue(design).toFixed(1)} L
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-semibold text-primary">₹{getDesignRevenue(design).toFixed(1)} L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Margin</span>
                  <span className={cn('font-semibold', marginIndicator?.color)}>
                    {design.avgMargin?.toFixed(1)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">{activeOptions} opts</span>
            <span className="font-semibold text-gray-900">{totalQty.toLocaleString()} units</span>
          </div>
        </div>

        {activeOptions === 0 && (
          <div className="bg-red-50 rounded px-2 py-1">
            <p className="text-xs text-red-700 font-medium">Configure</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyPlanFooter({
  buyPlan,
  onSubmitForCosting,
  onConfirmBuyPlan,
  hasZeroActiveOptions,
  hasZeroQuantity,
}: {
  buyPlan: CategoryBuyPlan | BrandBuyPlan;
  onSubmitForCosting: () => void;
  onConfirmBuyPlan: () => void;
  hasZeroActiveOptions: boolean;
  hasZeroQuantity: boolean;
}) {
  const canSubmitForCosting = !hasZeroActiveOptions && !hasZeroQuantity;

  const getFooterContent = () => {
    switch (buyPlan.status) {
      case 'draft':
        return (
          <>
            <div className="text-sm text-gray-600">
              Review and configure options before submitting for costing
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Save Draft</Button>
              <Button
                onClick={onSubmitForCosting}
                disabled={!canSubmitForCosting}
                size="sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Submit for Costing
              </Button>
            </div>
          </>
        );

      case 'pending_costing':
        return (
          <>
            <div className="flex items-center gap-2 text-sm text-primary">
              <Clock className="w-3 h-3 animate-spin" />
              Costing in progress... Awaiting response from Costing Engine
            </div>
            <Badge variant="outline">No actions available</Badge>
          </>
        );

      case 'costing_received':
        return (
          <>
            <div className="text-sm text-gray-600">
              Costing received - Review and confirm
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Save Draft</Button>
              <Button
                onClick={onConfirmBuyPlan}
                size="sm"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Buy Plan
              </Button>
            </div>
          </>
        );

      case 'confirmed':
        return (
          <>
            <div className="text-sm text-amber-600">
              Awaiting approval
            </div>
            <Badge variant="warning">Pending Approval</Badge>
          </>
        );

      case 'approved':
        return (
          <div className="text-sm text-green-700 font-medium flex items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            Approved - Feeding into Distribution Plan
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200">
      <div className="px-4 py-3">
        {(hasZeroActiveOptions || hasZeroQuantity) && buyPlan.status === 'draft' && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                {hasZeroActiveOptions && <p>Some designs have no active options</p>}
                {hasZeroQuantity && <p>Some options have 0 quantity</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {getFooterContent()}
        </div>
      </div>
    </div>
  );
}

function OptionDetailPanel({
  design,
  onClose,
  status,
}: {
  design: Design;
  onClose: () => void;
  status: BuyPlanStatus;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOptions, setEditedOptions] = useState(design.colorOptions);
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const isPreCosting = status === 'draft';
  const totalQty = editedOptions.reduce((sum, opt) => sum + (opt.isActive ? opt.quantity : 0), 0);
  const activeOptions = editedOptions.filter(opt => opt.isActive).length;

  const handleToggleOption = (index: number) => {
    if (!isEditing) return;
    const updated = [...editedOptions];
    const option = updated[index];
    if (!option) return;
    option.isActive = !option.isActive;
    setEditedOptions(updated);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (!isEditing) return;
    const updated = [...editedOptions];
    const option = updated[index];
    if (!option) return;
    option.quantity = Math.max(0, newQuantity);
    setEditedOptions(updated);
  };

  const handleMrpChange = (index: number, newMrp: number) => {
    if (!isEditing) return;
    const updated = [...editedOptions];
    const option = updated[index];
    if (!option) return;
    option.mrp = Math.max(0, newMrp);
    setEditedOptions(updated);
  };

  const handleAddColor = () => {
    if (!newColorName || !newColorHex) return;
    const newOption = {
      color: newColorName,
      hexCode: newColorHex,
      isActive: true,
      quantity: 1000,
      suggestedQuantity: 1000,
      confirmedCost: undefined,
      margin: undefined,
      intakeValue: undefined,
    };
    setEditedOptions([...editedOptions, newOption]);
    setNewColorName('');
    setNewColorHex('#000000');
    setShowAddColor(false);
  };

  const handleSave = () => {
    // In a real app, this would save the changes
    console.log('Saving changes:', editedOptions);
    setIsEditing(false);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={design.name}
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {design.brand} • {design.styleCode} • ASP: ₹{design.asp}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={status !== 'draft' && status !== 'costing_received'}
              >
                <Edit2 className="w-4 h-4" />
                {status === 'costing_received' ? 'Edit MRP' : 'Edit Options'}
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Color Options (Full Size Set S-XXL Included)</h3>
            {isEditing && status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddColor(true)}
              >
                <Plus className="w-4 h-4" />
                Add Color
              </Button>
            )}
          </div>

          {showAddColor && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="color-name" className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
                  <Input
                    id="color-name"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="e.g., Navy Blue"
                  />
                </div>
                <div>
                  <label htmlFor="color-picker" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <Input
                    id="color-picker"
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="h-10 w-full"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button size="sm" onClick={handleAddColor}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddColor(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {editedOptions.map((option, index) => (
              <div
                key={option.color}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  option.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full border-2 mt-1',
                        option.isActive ? 'border-gray-400' : 'border-gray-200',
                        option.hexCode === '#FFFFFF' ? 'bg-white' :
                        option.hexCode === '#000000' ? 'bg-black' :
                        option.hexCode === '#FF0000' ? 'bg-red-500' :
                        option.hexCode === '#00FF00' ? 'bg-green-500' :
                        option.hexCode === '#0000FF' ? 'bg-blue-500' :
                        option.hexCode === '#FFFF00' ? 'bg-yellow-400' :
                        option.hexCode === '#FF00FF' ? 'bg-purple-500' :
                        option.hexCode === '#00FFFF' ? 'bg-cyan-500' :
                        option.hexCode === '#FFA500' ? 'bg-orange-500' :
                        option.hexCode === '#808080' ? 'bg-gray-500' :
                        'bg-gray-400'
                      )}
                      title={option.color}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{option.color}</span>
                        {isEditing && status === 'draft' ? (
                          <Switch
                            checked={option.isActive}
                            onCheckedChange={() => handleToggleOption(index)}
                          />
                        ) : (
                          <Badge variant={option.isActive ? "success" : "default"} size="sm">
                            {option.isActive ? "Active" : "Inactive"}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Quantity (Full Size Set)</div>
                          {isEditing && option.isActive && status === 'draft' ? (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={() => handleQuantityChange(index, option.quantity - 100)}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <Input
                                type="number"
                                value={option.quantity.toString()}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                className="w-20 text-sm text-center"
                              />
                              <button
                                onClick={() => handleQuantityChange(index, option.quantity + 100)}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900 mt-1">
                              {option.quantity.toLocaleString()} units
                            </div>
                          )}
                          {option.suggestedQuantity !== option.quantity && (
                            <div className="text-xs text-amber-600 mt-1">
                              Suggested: {option.suggestedQuantity.toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-xs text-gray-500">ROS (Rate of Sale)</div>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {((option.quantity / 30) * 0.15).toFixed(0)} units/day
                          </div>
                          <div className="text-xs text-gray-500">
                            Sell-through: 75%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {!isPreCosting && option.confirmedCost && (
                          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                            <div>
                              <div className="text-xs text-gray-500">Cost/Unit</div>
                              <div className="text-sm font-medium text-gray-900">₹{option.confirmedCost}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Margin</div>
                              <div className={cn(
                                "text-sm font-medium",
                                (option.margin || 0) >= 55 ? "text-green-700" :
                                (option.margin || 0) >= 45 ? "text-amber-700" :
                                "text-red-700"
                              )}>
                                {option.margin?.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Intake Value</div>
                              <div className="text-sm font-medium text-gray-900">
                                ₹{((option.intakeValue || 0) / 100000).toFixed(2)} L
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={cn("grid grid-cols-2 gap-3", !isPreCosting || "pt-3 border-t border-gray-100")}>
                          <div>
                            <div className="text-xs text-gray-500">MRP {option.mrp ? '' : '(System Suggested)'}</div>
                            {isEditing && option.isActive && status === 'costing_received' ? (
                              <div className="flex items-center gap-1 mt-1">
                                <Input
                                  type="number"
                                  value={(option.mrp || Math.floor(design.asp * 2.2)).toString()}
                                  onChange={(e) => handleMrpChange(index, parseInt(e.target.value) || 0)}
                                  className="w-24 text-sm"
                                  placeholder="MRP"
                                />
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                ₹{option.mrp || Math.floor(design.asp * 2.2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Expected Revenue</div>
                            <div className="text-sm font-medium text-primary">
                              ₹{((option.quantity * (option.mrp || Math.floor(design.asp * 2.2))) / 100000).toFixed(2)} L
                            </div>
                          </div>
                        </div>

                        {isPreCosting && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-gray-500">Est. Value (at ASP)</div>
                              <div className="text-sm font-medium text-gray-900">
                                ₹{((option.quantity * design.asp) / 100000).toFixed(2)} L
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Est. Margin</div>
                              <div className="text-sm font-medium text-amber-700">~55%</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Size Ratio: S(15%) M(25%) L(30%) XL(20%) XXL(10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">Active Options</div>
              <div className="font-semibold text-gray-900">{activeOptions} of {editedOptions.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Quantity</div>
              <div className="font-semibold text-gray-900">{totalQty.toLocaleString()} units</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">ASP</div>
              <div className="font-semibold text-gray-900">₹{design.asp}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            {isPreCosting ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Estimated Retail Value</div>
                  <div className="text-lg font-bold text-primary">
                    ₹{((totalQty * design.asp) / 100000).toFixed(2)} L
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Projected ROS</div>
                  <div className="text-sm font-medium text-gray-900">
                    {((totalQty / 30) * 0.15).toFixed(0)} units/day
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Average Cost</div>
                  <div className="font-medium text-gray-900">₹{design.avgCost?.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Average Margin</div>
                  <div className={cn(
                    "font-medium",
                    (design.avgMargin || 0) >= 55 ? "text-green-700" :
                    (design.avgMargin || 0) >= 45 ? "text-amber-700" :
                    "text-red-700"
                  )}>
                    {design.avgMargin?.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Intake Value</div>
                  <div className="text-lg font-bold text-primary">
                    ₹{((editedOptions.reduce((sum, opt) => sum + (opt.isActive ? (opt.intakeValue || opt.quantity * design.asp * 0.45) : 0), 0)) / 100000).toFixed(2)} L
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {status === 'draft' && activeOptions === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 font-medium">Configuration Required</p>
            <p className="text-xs text-amber-600 mt-1">
              This design has no active color options. Please activate at least one option to include it in the buy plan.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}