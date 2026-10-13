import { NavLink, useLocation } from 'react-router-dom';
import { /* LayoutDashboard, */ BookOpen, Search, Workflow, /* BarChart3, */ LayoutGrid, Grid3x3, /* Layers, */ ListFilter, Check, ChevronRight, X, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import { useStyleBankStore } from '../stores/store';
import type { LucideIcon } from 'lucide-react';
import type { CurationStage } from '../types/showroom-types';
import type { DiscoverLayout } from '../types/types';

interface ShowroomStepperProps {
  className?: string;
}

interface StepDef {
  label: string;
  to: string;
  icon: LucideIcon;
}

const CURATE_STAGES: { key: 'designer_shortlist' | 'buyer_shortlist' | 'final_approved'; label: string }[] = [
  { key: 'designer_shortlist', label: 'Designer' },
  { key: 'buyer_shortlist', label: 'Buyer' },
  { key: 'final_approved', label: 'Category Head' },
];

const STAGE_ORDER: Record<string, number> = {
  designer_shortlist: 0,
  buyer_shortlist: 1,
  final_approved: 2,
};

export function ShowroomStepper({ className }: ShowroomStepperProps) {
  const location = useLocation();
  const isDiscover = location.pathname.startsWith('/showroom/discover');
  const isCurate = location.pathname.startsWith('/showroom/curate');

  const steps: StepDef[] = [
    // { label: 'Overview', to: '/showroom', icon: LayoutDashboard },
    { label: 'Brands', to: '/showroom/brands', icon: BookOpen },
    // { label: 'Discover', to: '/showroom/discover', icon: Search },
    { label: 'Curate', to: '/showroom/curate', icon: Workflow },
    // { label: 'Progress', to: '/showroom/progress', icon: BarChart3 },
  ];

  return (
    <div className={cn('bg-white border-b border-gray-200 px-6 pt-3 pb-3', className)}>
      <h1 className="text-lg font-bold text-gray-900 mb-2">Design Showroom</h1>
      <nav className="flex items-center" aria-label="Showroom steps">
        {steps.map((step, idx) => (
          <div key={step.to} className="flex items-center">
            {idx > 0 && (
              <div className="w-12 h-px bg-gray-300 mx-1" aria-hidden="true" />
            )}
            <NavLink
              to={step.to}
              end={step.to === '/showroom'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    <step.icon className="w-3 h-3" />
                  </span>
                  <span>{step.label}</span>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>
      {isDiscover && <DiscoverSubNav />}
      {isCurate && <CurateSubNav />}
    </div>
  );
}

// ── Discover sub-navigation (rendered inside stepper when on /showroom/discover) ──

const DISCOVER_LAYOUTS: { value: DiscoverLayout; label: string; icon: React.ElementType }[] = [
  // { value: 'feed', label: 'Feed', icon: LayoutGrid },
  { value: 'grid', label: 'Grid', icon: Grid3x3 },
  // { value: 'collections', label: 'Collections', icon: Layers },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
  { value: 'margin-asc', label: 'Margin ↑' },
  { value: 'margin-desc', label: 'Margin ↓' },
  { value: 'name-az', label: 'Name A-Z' },
];

function DiscoverSubNav() {
  const { searchQuery, setSearchQuery, discoverLayout, setDiscoverLayout, setSelectedCollection, sortOrder, setSortOrder } = useStyleBankStore();
  const { filteredStyles } = useShowroomCurationStore();

  return (
    // eslint-disable-next-line design-system/prefer-section-header -- discover sub-nav with search, sort, count and view toggle
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500">
          {filteredStyles.length} style{filteredStyles.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-gray-400" />
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Search designs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          rightIcon={
            searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : undefined
          }
          className="w-56 py-1.5 text-sm"
        />
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {DISCOVER_LAYOUTS.map((opt) => {
            const Icon = opt.icon;
            const isActive = discoverLayout === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedCollection(null);
                  setDiscoverLayout(opt.value);
                }}
                className={cn(
                  'px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
                title={opt.label}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Curate sub-navigation (rendered inside stepper when on /showroom/curate) ──

function CurateSubNav() {
  const {
    activeCurationStage, setActiveCurationStage,
    setActivePersona,
    curateViewTab, setCurateViewTab,
    showConstraintPanel, toggleConstraintPanel,
  } = useShowroomCurationStore();

  const stepperActiveStage = activeCurationStage === 'pool' || activeCurationStage === 'designer_shortlist'
    ? 'designer_shortlist' as const
    : activeCurationStage === 'buyer_shortlist'
      ? 'buyer_shortlist' as const
      : 'final_approved' as const;

  const activeIndex = STAGE_ORDER[stepperActiveStage] ?? 0;

  const handleStageClick = (stage: CurationStage) => {
    setActiveCurationStage(stage);
    setActivePersona(
      stage === 'designer_shortlist' ? 'designer'
        : stage === 'buyer_shortlist' ? 'buyer'
        : 'category_head'
    );
  };

  return (
    // eslint-disable-next-line design-system/prefer-section-header -- curate sub-nav with stage stepper and view toggle
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1">
        {CURATE_STAGES.map((stage, idx) => {
          const isActive = stage.key === stepperActiveStage;
          const isCompleted = idx < activeIndex;
          const isPending = idx > activeIndex;

          return (
            <div key={stage.key} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    isCompleted ? 'text-green-500' : 'text-gray-400'
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => handleStageClick(stage.key)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
                  isActive && 'bg-primary text-white',
                  isCompleted && 'bg-green-50 text-green-700 border border-green-200',
                  isPending && 'bg-gray-100 text-gray-500'
                )}
              >
                {isCompleted && <Check className="w-3 h-3 text-green-600" />}
                <span>{stage.label}</span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setCurateViewTab('styles')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
              curateViewTab === 'styles'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Styles
          </button>
          {/* <button
            onClick={() => setCurateViewTab('boards')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
              curateViewTab === 'boards'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Boards
          </button> */}
        </div>
        <button
          onClick={toggleConstraintPanel}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
            showConstraintPanel ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-400'
          )}
        >
          <ListFilter className="w-3.5 h-3.5" />
          Constraints
        </button>
      </div>
    </div>
  );
}
