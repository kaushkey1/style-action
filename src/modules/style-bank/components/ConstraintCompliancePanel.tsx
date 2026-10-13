import { X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import { Badge } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

interface ConstraintCompliancePanelProps {
  onClose: () => void;
}

export function ConstraintCompliancePanel({ onClose }: ConstraintCompliancePanelProps) {
  const { compliance } = useShowroomCurationStore();

  if (!compliance) return null;

  const { checks, issues, overallScore } = compliance;

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto h-full">
      {/* Header */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- panel header with close button */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Range Compliance</h3>
          <Badge
            variant={overallScore >= 90 ? 'success' : overallScore >= 75 ? 'warning' : 'error'}
            size="sm"
          >
            {overallScore}%
          </Badge>
        </div>
        <button onClick={onClose} className="p-2 -m-1 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close compliance panel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Option Count */}
        <Section title="Option Count" pass={checks.optionCount.pass}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">{checks.optionCount.actual} / {checks.optionCount.target} target</span>
            <span className="font-medium">{Math.round(checks.optionCount.actual / checks.optionCount.target * 100)}%</span>
          </div>
          <ProgressBar value={checks.optionCount.actual / checks.optionCount.target * 100} pass={checks.optionCount.pass} />
        </Section>

        {/* Segment Mix */}
        <Section title="Segment Mix" pass={checks.segmentMix.segments.every((s) => s.pass)}>
          <div className="space-y-2">
            {checks.segmentMix.segments.map((seg) => (
              <div key={seg.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{seg.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', seg.pass ? 'text-gray-900' : 'text-red-600')}>
                    {seg.actual}%
                  </span>
                  <span className="text-gray-500">(target {seg.target}%)</span>
                  {seg.pass ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Core / Fashion Split */}
        <Section title="Core / Fashion Split" pass={checks.coreFashionSplit.pass}>
          <div className="flex rounded-full overflow-hidden h-3 mb-2">
            { }
            <div
              className="bg-primary transition-all"
              // eslint-disable-next-line no-restricted-syntax -- dynamic width
              style={{ width: `${checks.coreFashionSplit.coreActual}%` }}
            />
            { }
            <div
              className="bg-amber-400 transition-all"
              // eslint-disable-next-line no-restricted-syntax -- dynamic width
              style={{ width: `${checks.coreFashionSplit.fashionActual}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Core {checks.coreFashionSplit.coreActual}%
            </span>
            <span className="text-gray-600">
              Fashion {checks.coreFashionSplit.fashionActual}%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Target: {checks.coreFashionSplit.coreTarget}% / {checks.coreFashionSplit.fashionTarget}%
          </p>
        </Section>

        {/* Price Ladder Coverage */}
        <Section title="Price Ladder Coverage" pass={checks.priceLadder.gaps.length === 0}>
          <div className="space-y-1.5">
            {checks.priceLadder.tiers.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{tier.tier} — {tier.subCategory}</span>
                {tier.covered ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                )}
              </div>
            ))}
          </div>
          {checks.priceLadder.gaps.length > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              Gap: {checks.priceLadder.gaps.join(', ')}
            </div>
          )}
        </Section>

        {/* Margin Distribution */}
        <Section title="Margin Floor" pass={checks.marginFloor.pass}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                { }
                <div
                  className="h-full bg-green-500 rounded-full"
                  // eslint-disable-next-line no-restricted-syntax -- dynamic width
                  style={{ width: `${checks.marginFloor.passingStyles / (checks.marginFloor.passingStyles + checks.marginFloor.failingStyles) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-600">
                ≥53%: {checks.marginFloor.passingStyles} styles
              </span>
              <span className="text-red-600">
                &lt;53%: {checks.marginFloor.failingStyles} styles
              </span>
            </div>
          </div>
        </Section>

        {/* OTB Budget */}
        <Section title="OTB Budget" pass={checks.otbBudget.pass}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">
              {formatCurrency(checks.otbBudget.utilized)} / {formatCurrency(checks.otbBudget.envelope)}
            </span>
            <span className="font-medium">{checks.otbBudget.percentage}%</span>
          </div>
          <ProgressBar value={checks.otbBudget.percentage} pass={checks.otbBudget.pass} />
        </Section>

        {/* Fabric Palette */}
        <Section title="Fabric Palette" pass={checks.fabricPalette.pass}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">In palette: {checks.fabricPalette.inPalette}</span>
            {checks.fabricPalette.outOfPalette > 0 && (
              <span className="text-amber-600">Out: {checks.fabricPalette.outOfPalette}</span>
            )}
          </div>
        </Section>

        {/* Fixture Capacity */}
        <Section title="Fixture Capacity" pass={checks.fixtureCapacity.pass}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {checks.fixtureCapacity.mapped} / {checks.fixtureCapacity.total} mapped
            </span>
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          </div>
        </Section>

        {/* Issues */}
        {issues.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">
              Issues to Resolve
            </h4>
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {issue.severity === 'critical' ? (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-900">{issue.description}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, pass, children }: { title: string; pass: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3">
      {/* eslint-disable-next-line design-system/prefer-section-header -- constraint check title with pass/fail icon */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-700">{title}</h4>
        {pass ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ value, pass }: { value: number; pass: boolean }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      { }
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          pass ? 'bg-green-500' : value >= 75 ? 'bg-amber-500' : 'bg-red-500'
        )}
        // eslint-disable-next-line no-restricted-syntax -- dynamic width
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
