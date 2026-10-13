import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  Badge,
  Progress,
  SectionHeader,
} from '@/components/ui';
import {
  Package,
  ShoppingCart,
  Zap,
  CheckCircle,
} from 'lucide-react';
import {
  mockFashionBuyPlans,
  mockCoreBuyPlan,
  mockCriticalPath,
  type BuyPlanMode,
  type BuyPlanStage,
} from '../data/mockBuyPlan';
import { BuyPlanShowbackPage } from './BuyPlanShowbackPage';
import { BuyPlanCostFinalisationPage } from './BuyPlanCostFinalisationPage';
import { BuyPlanCorePage } from './BuyPlanCorePage';

// ─── Header Components ──────────────────────────────────────────────────────

function BuyPlanPageHeader() {
  return (
    <PageHeader
      title="Buy Plan"
      backTo={{ label: 'Command Center', path: '/' }}
      actions={
        <>
          <Badge variant="outline" size="sm">SS24</Badge>
          <Badge variant="primary" size="sm">Active</Badge>
        </>
      }
    />
  );
}

// ─── Mode Toggle (Fashion/Core) ──────────────────────────────────────────────

interface ModeToggleProps {
  mode: BuyPlanMode;
  setMode: (mode: BuyPlanMode) => void;
}

function ModeToggle({ mode, setMode }: ModeToggleProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-1 -mb-px overflow-x-auto">
        <button
          onClick={() => setMode('fashion')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${mode === 'fashion'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <Package className="w-4 h-4" />
          Fashion & Fashion Basic
          <Badge variant="outline" size="sm">Fashion</Badge>
        </button>
        <button
          onClick={() => setMode('core')}
          className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${mode === 'core'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <Zap className="w-4 h-4" />
          Core / NOOS
          <Badge variant="outline" size="sm">Core</Badge>
        </button>
      </nav>
    </div>
  );
}

// ─── Pipeline Breadcrumb ─────────────────────────────────────────────────────

interface PipelineBreadcrumbProps {
  stage: BuyPlanStage;
  setStage: (stage: BuyPlanStage) => void;
  mode: BuyPlanMode;
}

function PipelineBreadcrumb({ stage, setStage, mode }: PipelineBreadcrumbProps) {
  if (mode === 'core') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">VMI Auto-Replenishment</span>
          <Badge variant="info" size="sm">Active</Badge>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Vendor Managed Inventory system automatically generates reorder proposals based on stock levels and sales velocity.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Buy Plan Pipeline:</span>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => setStage('showback')}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
              ${stage === 'showback'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Package className="w-3 h-3" />
            Showback
          </button>
          <div className="w-4 h-px bg-gray-300"></div>
          <button
            onClick={() => setStage('cost-finalisation')}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
              ${stage === 'cost-finalisation'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <ShoppingCart className="w-3 h-3" />
            Cost Finalisation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Critical Path Bar ───────────────────────────────────────────────────────

function CriticalPathBar() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <SectionHeader
        title="Critical Path Timeline"
        subtitle="Key milestones for SS24 buy plan completion"
        className="mb-3"
      />
      <div className="space-y-3">
        {mockCriticalPath.map((milestone, index) => {
          const isActive = milestone.status === 'current';
          const isCompleted = false; // Mock data doesn't have completed status
          const progress = (milestone.completedTasks / milestone.totalTasks) * 100;

          return (
            <div key={milestone.stage} className="flex items-center gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                ${isCompleted ? 'bg-green-100' : isActive ? 'bg-primary' : 'bg-gray-100'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : isActive ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                      {milestone.title}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      Due: {new Date(milestone.dueDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {milestone.completedTasks}/{milestone.totalTasks}
                  </div>
                </div>
                <Progress
                  value={progress}
                  size="sm"
                  className="mt-1"
                  indicatorClassName={isCompleted ? 'bg-green-500' : isActive ? 'bg-primary' : 'bg-gray-400'}
                />
              </div>

              {index < mockCriticalPath.length - 1 && (
                <div className="w-8 h-px bg-gray-200 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BuyPlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const modeParam = searchParams.get('mode') as BuyPlanMode || 'fashion';
  const stageParam = searchParams.get('stage') as BuyPlanStage || 'showback';

  const setMode = (mode: BuyPlanMode) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('mode', mode);
      if (mode === 'core') {
        newParams.delete('stage'); // Core only has one view
      }
      return newParams;
    });
  };

  const setStage = (stage: BuyPlanStage) => {
    if (modeParam === 'core') return; // Core doesn't have stages
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('stage', stage);
      return newParams;
    });
  };

  // Get relevant buy plan data
  const activeBuyPlan = useMemo(() => {
    if (modeParam === 'core') return mockCoreBuyPlan;
    return mockFashionBuyPlans.find(bp => bp.stage === stageParam);
  }, [modeParam, stageParam]);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <BuyPlanPageHeader />

      <ModeToggle mode={modeParam} setMode={setMode} />

      {modeParam === 'fashion' && (
        <PipelineBreadcrumb stage={stageParam} setStage={setStage} mode={modeParam} />
      )}

      {modeParam === 'core' && <PipelineBreadcrumb stage={stageParam} setStage={setStage} mode={modeParam} />}

      {modeParam === 'fashion' && <CriticalPathBar />}

      {/* Content based on mode and stage */}
      {modeParam === 'fashion' && stageParam === 'showback' && (
        <BuyPlanShowbackPage buyPlan={activeBuyPlan} />
      )}

      {modeParam === 'fashion' && stageParam === 'cost-finalisation' && (
        <BuyPlanCostFinalisationPage buyPlan={activeBuyPlan} />
      )}

      {modeParam === 'core' && (
        <BuyPlanCorePage buyPlan={activeBuyPlan} />
      )}
    </div>
  );
}