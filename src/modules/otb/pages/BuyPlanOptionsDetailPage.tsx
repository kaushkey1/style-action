/* eslint-disable design-system/prefer-metric-grid, design-system/prefer-section-header */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Edit2,
  Save,
  X,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  Input,
  Switch,
} from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { useModulePermissions } from '@/permissions';
import {
  getMockOptionsBuyPlan,
  getOptionRevenue,
  getTotalActiveOptions,
  getTotalQuantity,
  getTotalRevenue,
  type Option,
  type OptionsBuyPlan,
  type BuyPlanStatus,
} from '@/data/mockBuyPlanOptions';

// Helper function to get full category name from code
const getCategoryName = (code: string): string => {
  const categoryMap: Record<string, string> = {
    // Men's Categories
    'MW-DNM': 'Men Western: Denim Bottoms',
    'MW-NDB': 'Men Western: Non-Denim Bottoms',
    'MW-CTS': 'Men Western: Casual T-shirts',
    'MW-CSH': 'Men Western: Casual Shirts',
    'MW-FSH': 'Men Western: Formal Shirts',
    'MW-FTS': 'Men Western: Formal Trouser & Suits',
    'MI-FST': 'Men Indian: Festive Wear',
    'MW-SPT': 'Men: Sports / Athleisure',
    'MW': 'Menswear', // Backward compatibility

    // Women's Categories
    'WW-TOP': 'Women: Western Tops',
    'WW-DRS': 'Women: Western Dress, Jackets and Blazers',
    'WW-DNM': 'Women Western Denim Bottoms',
    'WW-NDB': 'Women Western Non-Denim Bottoms',
    'WW-KUR': 'Women Indian Kurta/SKD/Bottoms',
    'WW-SAR': 'Women Indian: Saree/Lehenga',
    'WIF-FST': 'Women Indian/Fusion: Festive SKD',
    'WW-SPT': 'Women: Sports / Athleisure',
    'WW': 'Womenswear', // Backward compatibility

    // Kids' Categories
    'KW-INF': 'Kids: Infant',
    'KW-BOY': 'Kids: Boys',
    'KW-GRL': 'Kids: Girls',
    'KW': 'Kidswear', // Backward compatibility
  };

  return categoryMap[code] || code;
};

export default function BuyPlanOptionsDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { edit: canEdit } = useModulePermissions('buyPlan');
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [buyPlan, setBuyPlan] = useState<OptionsBuyPlan>(() => getMockOptionsBuyPlan(id));

  const toggleOptionExpanded = (optionId: string) => {
    setExpandedOptions(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(optionId)) {
        newExpanded.delete(optionId);
      } else {
        // Close all other expanded options (optional - for single expansion at a time)
        // newExpanded.clear();
        newExpanded.add(optionId);
      }
      return newExpanded;
    });
  };

  const handleQuantityChange = (optionId: string, delta: number) => {
    setBuyPlan(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId
          ? { ...opt, plannedQty: Math.max(0, opt.plannedQty + delta) }
          : opt
      ),
    }));
  };

  const handleMrpChange = (optionId: string, mrp: number) => {
    setBuyPlan(prev => ({
      ...prev,
      options: prev.options.map(opt => {
        if (opt.id === optionId) {
          const updatedOption = { ...opt, mrp };
          // Calculate actual margin if cost is available
          if (opt.cost && mrp > 0) {
            updatedOption.actualMargin = ((mrp - opt.cost) / mrp) * 100;
            updatedOption.intakeMargin = updatedOption.actualMargin;
          }
          return updatedOption;
        }
        return opt;
      }),
    }));
  };

  const toggleOptionActive = (optionId: string) => {
    setBuyPlan(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === optionId
          ? { ...opt, isActive: !opt.isActive }
          : opt
      ),
    }));
  };

  const totalActiveOptions = getTotalActiveOptions(buyPlan);
  const totalQuantity = getTotalQuantity(buyPlan);
  const totalRevenue = getTotalRevenue(buyPlan);
  const otbUsagePercentage = Math.round((buyPlan.otbUsed / buyPlan.totalOtb) * 100);

  // Group options by style
  const optionsByStyle = buyPlan.options.reduce((acc, option) => {
    const styleId = option.styleId || 'unknown';
    if (!acc[styleId]) {
      acc[styleId] = [];
    }
    acc[styleId].push(option);
    return acc;
  }, {} as Record<string, Option[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={`Buy Plan - ${getCategoryName(buyPlan.categoryCode)} - ${buyPlan.fashionGrade}`}
        backTo={{ label: getCategoryName(buyPlan.categoryCode), path: `/buy-plans/category/${buyPlan.categoryCode}` }}
        badges={
          <>
            <Badge variant={buyPlan.status === 'draft' ? 'default' : 'success'}>
              {buyPlan.status}
            </Badge>
            <Badge>{buyPlan.hit}</Badge>
          </>
        }
      />

      <div className="px-6 py-6 space-y-6">
        {/* Pipeline Status */}
        <PipelineStatus status={buyPlan.status} options={buyPlan.options} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Package className="w-4 h-4" />
                Active Options
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalActiveOptions}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of {buyPlan.options.length} total
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <ShoppingBag className="w-4 h-4" />
                Total Quantity
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(totalQuantity / 1000).toFixed(1)} K
              </div>
              <div className="text-xs text-gray-500 mt-1">
                units planned
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Expected Revenue
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {getCurrencySymbol()}{(totalRevenue / 10000000).toFixed(2)} Cr
              </div>
              <div className="text-xs text-gray-500 mt-1">
                projected
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                OTB Used
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {otbUsagePercentage}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getCurrencySymbol()}{(buyPlan.otbUsed / 10000000).toFixed(2)} Cr of {getCurrencySymbol()}{(buyPlan.totalOtb / 10000000).toFixed(2)} Cr
              </div>
            </div>
          </Card>
        </div>

        {/* Options Grid */}
        <div className="space-y-6">
          {Object.entries(optionsByStyle).map(([styleId, options]) => {
            const style = options[0]?.style;
            return (
              <div key={styleId} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{style?.name || 'Style'}</h3>
                  <Badge variant="outline" className="text-xs">
                    {style?.styleCode || 'CODE'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {style?.brand || ''} • {style?.category || ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {options.map(option => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      isExpanded={expandedOptions.has(option.id)}
                      isEditing={editingOption === option.id}
                      buyPlanStatus={buyPlan.status}
                      onToggleExpanded={() => toggleOptionExpanded(option.id)}
                      onToggleActive={() => toggleOptionActive(option.id)}
                      onQuantityChange={(delta) => handleQuantityChange(option.id, delta)}
                      onMrpChange={(mrp) => handleMrpChange(option.id, mrp)}
                      onStartEdit={() => setEditingOption(option.id)}
                      onEndEdit={() => setEditingOption(null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons - Stage Specific */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => navigate('/buy-plans')}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Buy Plans
          </Button>
          <div className="flex items-center gap-2">
            {buyPlan.status === 'draft' && canEdit && (
              <>
                <Button variant="outline">
                  Save Draft
                </Button>
                <Button onClick={() => setBuyPlan(prev => ({ ...prev, status: 'pending_costing' }))}>
                  <Send className="w-4 h-4" />
                  Submit for Costing
                </Button>
              </>
            )}
            {buyPlan.status === 'pending_costing' && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="w-4 h-4 animate-pulse" />
                Awaiting costing from vendor...
              </div>
            )}
            {buyPlan.status === 'costing_received' && canEdit && (
              <>
                <Button variant="outline">
                  Save Changes
                </Button>
                <Button onClick={() => setBuyPlan(prev => ({ ...prev, status: 'pending_approval' }))}>
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </Button>
              </>
            )}
            {buyPlan.status === 'pending_approval' && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="w-4 h-4 animate-pulse" />
                Pending approval...
              </div>
            )}
            {(buyPlan.status === 'approved' || buyPlan.status === 'partial_dp') && (
              <>
                <Button variant="outline">
                  View Selected Options
                </Button>
                {canEdit && (
                  <Button>
                    <Send className="w-4 h-4" />
                    Send to Distribution Plan
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  isExpanded,
  isEditing,
  buyPlanStatus,
  onToggleExpanded,
  onToggleActive,
  onQuantityChange,
  onMrpChange,
  onStartEdit,
  onEndEdit,
}: {
  option: Option;
  isExpanded: boolean;
  isEditing: boolean;
  buyPlanStatus: BuyPlanStatus;
  onToggleExpanded: () => void;
  onToggleActive: () => void;
  onQuantityChange: (delta: number) => void;
  onMrpChange?: (mrp: number) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
}) {
  const { edit: canEdit } = useModulePermissions('buyPlan');
  const revenue = getOptionRevenue(option);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border transition-all duration-200',
        option.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60',
        isExpanded && 'shadow-lg border-indigo-200 relative z-10'
      )}
    >
      {/* Card Header - Always Visible */}
      <div className="p-4 space-y-3">
        {/* Image and Basic Info */}
        <div className="flex gap-3">
          <div className="relative w-32 h-36 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <img
              src={option.imageUrl}
              alt={`${option.style.name} - ${option.color}`}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-6 border-t-2"
              // eslint-disable-next-line no-restricted-syntax
              style={{
                backgroundColor: option.hexCode,
                borderColor: option.hexCode === '#FFFFFF' ? '#e5e7eb' : option.hexCode,
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {option.color}
                </h4>
                <p className="text-xs text-gray-500">{option.colorCode}</p>
              </div>
              <Switch
                checked={option.isActive}
                onCheckedChange={onToggleActive}
                className="scale-75"
              />
            </div>

            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-600">
                ASP: <span className="font-medium">{getCurrencySymbol()}{option.asp}</span>
              </div>
              <div className="text-xs text-gray-600">
                Qty: <span className="font-medium">{option.plannedQty.toLocaleString()}</span>
              </div>
              {/* Show MRP and Cost for costing_received or later stages */}
              {['costing_received', 'pending_approval', 'approved', 'partial_dp'].includes(buyPlanStatus) && (
                <>
                  {option.mrp && (
                    <div className="text-xs text-gray-600">
                      MRP: <span className="font-medium text-green-600">{getCurrencySymbol()}{option.mrp}</span>
                    </div>
                  )}
                  {option.cost && (
                    <div className="text-xs text-gray-600">
                      Cost: <span className="font-medium">{getCurrencySymbol()}{option.cost}</span>
                    </div>
                  )}
                  {option.intakeMargin && (
                    <div className="text-xs text-gray-600">
                      Margin: <span className="font-medium">{option.intakeMargin.toFixed(1)}%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs">
            <span className="text-gray-500">Revenue:</span>
            <span className="ml-1 font-medium text-gray-900">
              {getCurrencySymbol()}{(revenue / 100000).toFixed(1)} L
            </span>
          </div>
          <button
            onClick={onToggleExpanded}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Style Attributes */}
          <div className="pt-3">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Style Details</h5>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Fabric: {option.style.attributes.fabric}</div>
              {option.style.attributes.fit && <div>Fit: {option.style.attributes.fit}</div>}
              {option.style.attributes.pattern && <div>Pattern: {option.style.attributes.pattern}</div>}
            </div>
          </div>

          {/* Quantity Controls - Only editable when in edit mode AND draft status */}
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Quantity Planning</h5>
            {isEditing && buyPlanStatus === 'draft' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQuantityChange(-100)}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={!option.isActive}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <Input
                  type="number"
                  value={option.plannedQty}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value) || 0;
                    onQuantityChange(newQty - option.plannedQty);
                  }}
                  className="w-24 h-7 text-xs text-center"
                  disabled={!option.isActive}
                />
                <button
                  onClick={() => onQuantityChange(100)}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={!option.isActive}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-900">
                {option.plannedQty.toLocaleString()} units
              </div>
            )}
            {buyPlanStatus !== 'draft' && (
              <p className="text-xs text-gray-400 mt-1">Quantity locked after Buy Plan Review</p>
            )}
          </div>

          {/* MRP Controls - Only visible and editable during costing_received AND in edit mode */}
          {(buyPlanStatus === 'costing_received' || option.mrp) && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Pricing</h5>
              <div className="space-y-2">
                {isEditing && buyPlanStatus === 'costing_received' ? (
                  <div className="flex items-center gap-2">
                    <label htmlFor="mrp-input" className="text-xs text-gray-600 w-12">MRP:</label>
                    <Input
                      id="mrp-input"
                      type="number"
                      value={option.mrp || ''}
                      onChange={(e) => {
                        const mrp = parseInt(e.target.value) || 0;
                        onMrpChange?.(mrp);
                      }}
                      className="w-20 h-7 text-xs"
                      placeholder="Enter MRP"
                    />
                  </div>
                ) : (
                  option.mrp && (
                    <div className="text-xs text-gray-600">
                      MRP: <span className="font-medium text-green-600">{getCurrencySymbol()}{option.mrp}</span>
                    </div>
                  )
                )}
                {option.cost && (
                  <div className="text-xs text-gray-600">
                    Cost: <span className="font-medium">{getCurrencySymbol()}{option.cost}</span> (from costing)
                  </div>
                )}
                {option.intakeMargin && (
                  <div className="text-xs text-gray-600">
                    Intake Margin: <span className="font-medium">{option.intakeMargin.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allocation Info */}
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-2">Allocation</h5>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Stores: {option.storeAllocation}</div>
              <div>Sizes: {option.sizes?.join(', ')}</div>
              <div>Target Margin: {option.targetMargin.toFixed(1)}%</div>
              {option.actualMargin && (
                <div>Actual Margin: <span className="font-medium">{option.actualMargin.toFixed(1)}%</span></div>
              )}
              {option.sentToDP && (
                <div className="text-green-600">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Sent to DP on {option.dpDate}
                </div>
              )}
            </div>
          </div>

          {/* Edit Actions - Only show for draft and costing_received stages */}
          {canEdit && (buyPlanStatus === 'draft' || buyPlanStatus === 'costing_received') && (
            <div className="flex items-center justify-end gap-2 pt-2">
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onStartEdit}
                  className="h-7 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Details
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEndEdit}
                    className="h-7 text-xs"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onEndEdit}
                    className="h-7 text-xs"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get status message
function getStatusMessage(status: BuyPlanStatus, optionsSentToDP: number, totalOptions: number) {
  switch (status) {
    case 'draft':
      return (
        <>
          <AlertCircle className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">
            Adjust quantities and send for costing when ready
          </span>
        </>
      );
    case 'pending_costing':
      return (
        <>
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-sm text-gray-600">
            Waiting for costing team response...
          </span>
        </>
      );
    case 'costing_received':
      return (
        <>
          <AlertCircle className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">
            Review costs and set MRP, then submit for approval
          </span>
        </>
      );
    case 'pending_approval':
      return (
        <>
          <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-sm text-gray-600">
            Awaiting management approval...
          </span>
        </>
      );
    case 'approved':
      return (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">
            Approved! Ready to send options to Distribution Plan
          </span>
        </>
      );
    case 'partial_dp':
      return (
        <>
          <Send className="w-4 h-4 text-primary" />
          <span className="text-sm text-gray-600">
            {optionsSentToDP} options sent to DP, {totalOptions - optionsSentToDP} remaining
          </span>
        </>
      );
    default:
      return null;
  }
}

function PipelineStatus({
  status,
  options
}: {
  status: BuyPlanStatus;
  options: Option[]
}) {
  const { edit: canEdit } = useModulePermissions('buyPlan');
  const stages = [
    {
      key: 'review',
      label: 'Buy Plan Review',
      states: ['draft'],
      icon: Edit2,
      description: 'Quantity editable'
    },
    {
      key: 'costing',
      label: 'Costing',
      states: ['pending_costing', 'costing_received'],
      icon: DollarSign,
      description: 'Cost & margin calculation'
    },
    {
      key: 'approval',
      label: 'Buy Plan Approval',
      states: ['pending_approval', 'approved', 'partial_dp'],
      icon: CheckCircle,
      description: 'Send to Distribution Plan'
    }
  ];

  const getStageStatus = (stage: typeof stages[0]) => {
    if (stage.states.includes(status)) {
      if (status === 'pending_costing' || status === 'pending_approval') return 'waiting';
      if (status === 'partial_dp') return 'partial';
      return 'active';
    }
    const currentIndex = stages.findIndex(s => s.states.includes(status));
    const stageIndex = stages.indexOf(stage);
    return stageIndex < currentIndex ? 'complete' : 'inactive';
  };

  // Calculate options sent to DP (for partial_dp status)
  const optionsSentToDP = options.filter(opt => opt.sentToDP).length;
  const totalOptions = options.filter(opt => opt.isActive).length;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage);
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    stageStatus === 'complete' ? 'bg-green-100' :
                    stageStatus === 'active' ? 'bg-indigo-600' :
                    stageStatus === 'waiting' ? 'bg-indigo-100 animate-pulse' :
                    stageStatus === 'partial' ? 'bg-amber-100' :
                    'bg-gray-100'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5',
                      stageStatus === 'complete' ? 'text-green-600' :
                      stageStatus === 'active' ? 'text-white' :
                      stageStatus === 'waiting' ? 'text-primary' :
                      stageStatus === 'partial' ? 'text-amber-600' :
                      'text-gray-400'
                    )} />
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      'text-xs font-medium',
                      stageStatus === 'inactive' ? 'text-gray-400' : 'text-gray-700'
                    )}>
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {stage.description}
                    </p>
                    {stage.key === 'approval' && status === 'partial_dp' && (
                      <p className="text-[10px] text-amber-600 font-medium mt-1">
                        {optionsSentToDP}/{totalOptions} sent to DP
                      </p>
                    )}
                  </div>
                </div>
                {index < stages.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-3 mt-[-20px]',
                    stageStatus === 'complete' ||
                    (stageStatus === 'partial' && index === 0) ||
                    (stageStatus === 'active' && index === 0) ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status Messages */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusMessage(status, optionsSentToDP, totalOptions)}
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <div className="flex items-center gap-2">
                {status === 'draft' && (
                  <Button size="sm">
                    Send to Costing
                  </Button>
                )}
                {status === 'costing_received' && (
                  <Button size="sm">
                    Submit for Approval
                  </Button>
                )}
                {(status === 'approved' || status === 'partial_dp') && (
                  <Button size="sm" variant="outline">
                    Send to Distribution Plan
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}