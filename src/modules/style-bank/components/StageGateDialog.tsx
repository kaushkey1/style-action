import { useState, useMemo } from 'react';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ModalFooter, Button, Input, Badge, Progress, SectionHeader } from '@/components/ui';

// ── Types ──────────────────────────────────────────────────────────────────

interface ComplianceSummary {
  totalStyles: number;
  passingStyles: number;
  avgMargin: number;
  belowMarginFloor: number;
  complianceScore: number;
  issues: Array<{ severity: 'critical' | 'warning'; description: string }>;
}

interface StyleEntry {
  id: string;
  name: string;
  margin: number;
  marginPass: boolean;
}

interface StageGateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  podId: string;
  podName: string;
  gateType: 'lock_shortlist' | 'approve_collection';
  onLockShortlist: () => void;
  onApproveCollection: () => void;
  onApproveWithExclusions: (excludedStyleIds: string[]) => void;
  onSendBack: () => void;
  complianceSummary: ComplianceSummary;
  styles?: StyleEntry[];
}

// ── Compliance Summary Card ────────────────────────────────────────────────

function ComplianceSummaryCard({ summary }: { summary: ComplianceSummary }) {
  const scoreColor =
    summary.complianceScore >= 90
      ? 'text-green-700'
      : summary.complianceScore >= 80
        ? 'text-amber-700'
        : 'text-red-700';

  const scoreBarColor =
    summary.complianceScore >= 90
      ? 'bg-green-500'
      : summary.complianceScore >= 80
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Styles Passing</p>
          <p className="text-sm font-semibold text-gray-900">
            {summary.passingStyles} / {summary.totalStyles}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Margin</p>
          <p className="text-sm font-semibold text-gray-900">{summary.avgMargin}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Below Margin Floor</p>
          <p className={cn('text-sm font-semibold', summary.belowMarginFloor > 0 ? 'text-red-700' : 'text-gray-900')}>
            {summary.belowMarginFloor}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Compliance Score</p>
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-semibold', scoreColor)}>
              {summary.complianceScore}%
            </p>
          </div>
        </div>
      </div>
      <Progress
        value={summary.complianceScore}
        size="sm"
        indicatorClassName={scoreBarColor}
      />
    </div>
  );
}

// ── Issues List ────────────────────────────────────────────────────────────

function IssuesList({ issues }: { issues: ComplianceSummary['issues'] }) {
  if (issues.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-500">Issues</p>
      {issues.map((issue, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2 rounded-lg p-2 text-xs',
            issue.severity === 'critical'
              ? 'bg-red-50 border border-red-100'
              : 'bg-amber-50 border border-amber-100'
          )}
        >
          {issue.severity === 'critical' ? (
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <span className="text-gray-700">{issue.description}</span>
        </div>
      ))}
    </div>
  );
}

// ── Critical Compliance Override ───────────────────────────────────────────

function CriticalComplianceOverride({
  complianceScore,
  confirmText,
  onConfirmTextChange,
}: {
  complianceScore: number;
  confirmText: string;
  onConfirmTextChange: (v: string) => void;
}) {
  if (complianceScore >= 80) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-900">
            Compliance below threshold ({complianceScore}%)
          </p>
          <p className="text-xs text-red-700 mt-0.5">
            To proceed, type APPROVE below to confirm override.
          </p>
        </div>
      </div>
      <Input
        placeholder='Type "APPROVE" to confirm'
        value={confirmText}
        onChange={(e) => onConfirmTextChange(e.target.value)}
        className="text-sm py-2"
      />
    </div>
  );
}

// ── Style Exclusion List ───────────────────────────────────────────────────

function StyleExclusionList({
  styles,
  excludedIds,
  onToggle,
}: {
  styles: StyleEntry[];
  excludedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const includedCount = styles.length - excludedIds.size;

  return (
    <div className="space-y-2">
      <SectionHeader
        title="Select styles to include"
        className="mb-0"
        actions={
          <Badge variant={excludedIds.size > 0 ? 'warning' : 'success'} size="sm">
            {includedCount} of {styles.length} included
          </Badge>
        }
      />
      {excludedIds.size > 0 && (
        <p className="text-xs text-amber-700">
          Approving {includedCount} of {styles.length} styles. {excludedIds.size} excluded for revision.
        </p>
      )}
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {styles.map((style) => {
          const isIncluded = !excludedIds.has(style.id);
          return (
            <label
              key={style.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                isIncluded ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              {/* eslint-disable-next-line no-restricted-syntax -- checkbox input; Input component is for text only */}
              <input
                type="checkbox"
                checked={isIncluded}
                onChange={() => onToggle(style.id)}
                className="rounded border-gray-300 text-primary focus-kb:ring-primary/20"
              />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium truncate', isIncluded ? 'text-gray-900' : 'text-gray-500')}>
                  {style.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-xs font-medium tabular-nums',
                  style.marginPass ? 'text-green-700' : 'text-red-700'
                )}>
                  {style.margin}%
                </span>
                {style.marginPass ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-red-500" />
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dialog ────────────────────────────────────────────────────────────

export function StageGateDialog({
  isOpen,
  onClose,
  podName,
  gateType,
  onLockShortlist,
  onApproveCollection,
  onApproveWithExclusions,
  onSendBack,
  complianceSummary,
  styles = [],
}: StageGateDialogProps) {
  const [showExclusions, setShowExclusions] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [confirmText, setConfirmText] = useState('');

  // Reset state when dialog opens/closes
  const handleClose = () => {
    setShowExclusions(false);
    setExcludedIds(new Set());
    setConfirmText('');
    onClose();
  };

  const isLowCompliance = complianceSummary.complianceScore < 80;
  const canOverride = !isLowCompliance || confirmText === 'APPROVE';

  const includedCount = useMemo(
    () => styles.length - excludedIds.size,
    [styles.length, excludedIds.size]
  );

  const handleToggleExclusion = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApproveWithExclusions = () => {
    onApproveWithExclusions(Array.from(excludedIds));
    handleClose();
  };

  const handleApproveCollection = () => {
    onApproveCollection();
    handleClose();
  };

  const handleLockShortlist = () => {
    onLockShortlist();
    handleClose();
  };

  const handleSendBack = () => {
    onSendBack();
    handleClose();
  };

  // ── Lock Shortlist Gate ──────────────────────────────────────────────────

  if (gateType === 'lock_shortlist') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Lock Shortlist \u2014 ${podName}`}
        description="You are locking the Buyer shortlist. This advances the collection to Category Head review."
        size="lg"
      >
        <div className="space-y-4">
          <ComplianceSummaryCard summary={complianceSummary} />
          <IssuesList issues={complianceSummary.issues} />
          <CriticalComplianceOverride
            complianceScore={complianceSummary.complianceScore}
            confirmText={confirmText}
            onConfirmTextChange={setConfirmText}
          />
        </div>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleLockShortlist}
            disabled={!canOverride}
          >
            Lock Shortlist
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  // ── Approve Collection Gate ──────────────────────────────────────────────

  // Exclusions mode
  if (showExclusions) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Approve with Exclusions \u2014 ${podName}`}
        description="Uncheck styles to exclude them from approval. Excluded styles will be returned to the Buyer for revision."
        size="lg"
      >
        <div className="space-y-4">
          <ComplianceSummaryCard summary={complianceSummary} />
          <StyleExclusionList
            styles={styles}
            excludedIds={excludedIds}
            onToggle={handleToggleExclusion}
          />
          <CriticalComplianceOverride
            complianceScore={complianceSummary.complianceScore}
            confirmText={confirmText}
            onConfirmTextChange={setConfirmText}
          />
        </div>

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={handleSendBack}>
            Send Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApproveWithExclusions}
            disabled={!canOverride || includedCount === 0}
          >
            Approve {includedCount} Style{includedCount !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  // Default approve collection mode
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Approve Collection \u2014 ${podName}`}
      description="Review the compliance summary before approving the collection for production."
      size="lg"
    >
      <div className="space-y-4">
        <ComplianceSummaryCard summary={complianceSummary} />
        <IssuesList issues={complianceSummary.issues} />
        <CriticalComplianceOverride
          complianceScore={complianceSummary.complianceScore}
          confirmText={confirmText}
          onConfirmTextChange={setConfirmText}
        />
      </div>

      <ModalFooter className="flex-wrap">
        <Button variant="outline" size="sm" onClick={handleSendBack}>
          Send Back with Comments
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExclusions(true)}
        >
          Approve with Exclusions
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApproveCollection}
          disabled={!canOverride}
        >
          {isLowCompliance ? 'Approve Anyway' : 'Approve Collection'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
