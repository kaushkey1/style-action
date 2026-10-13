import { useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { Button, Modal, ModalFooter, Input } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BottomSheet } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useReviewStore } from '../stores/useReviewStore';
import type { UnifiedItem } from '../data/mockReviewData';

const HIGH_VALUE_THRESHOLD = 10000000;

interface BatchActionBarProps {
  items: UnifiedItem[];
  onBatchApprove: (ids: string[]) => void;
  onBatchReject: (ids: string[]) => void;
}

export function BatchActionBar({
  items,
  onBatchApprove,
  onBatchReject,
}: BatchActionBarProps): React.ReactNode {
  const batchSelectedIds = useReviewStore((s) => s.batchSelectedIds);
  const clearBatch = useReviewStore((s) => s.clearBatch);
  const isMobile = useIsMobile();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (batchSelectedIds.length === 0) return null;

  const selectedItems = items.filter((item) => batchSelectedIds.includes(item.id));
  const aggregateImpact = selectedItems.reduce((sum, item) => sum + item.projectedImpactInr, 0);
  const isHighValue = aggregateImpact >= HIGH_VALUE_THRESHOLD;

  const handleApproveAll = (): void => {
    if (isHighValue) {
      setShowConfirmModal(true);
    } else {
      onBatchApprove(batchSelectedIds);
      clearBatch();
    }
  };

  const handleConfirmApprove = (): void => {
    if (confirmText === 'APPROVE') {
      onBatchApprove(batchSelectedIds);
      clearBatch();
      setShowConfirmModal(false);
      setConfirmText('');
    }
  };

  const handleRejectAll = (): void => {
    onBatchReject(batchSelectedIds);
    clearBatch();
  };

  const barContent = (
    <div className={cn(
      'flex items-center gap-3',
      isMobile ? 'flex-col' : 'justify-between',
    )}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">
          {batchSelectedIds.length} selected
        </span>
        <span className="text-sm text-gray-500">
          · {formatCurrency(aggregateImpact)} total
        </span>
        <button
          type="button"
          onClick={clearBatch}
          className="ml-1 p-1 rounded hover:bg-gray-100"
          aria-label="Clear selection"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className={cn('flex items-center gap-2', isMobile && 'w-full')}>
        {!isMobile && (
          <Button size="sm" variant="outline" onClick={() => setShowReviewModal(true)}>
            Review Changes →
          </Button>
        )}
        <Button
          size="sm"
          variant="outline-destructive"
          onClick={handleRejectAll}
          className={cn(isMobile && 'flex-1 min-h-11')}
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Reject All
        </Button>
        <Button
          size="sm"
          onClick={handleApproveAll}
          className={cn(isMobile && 'flex-1 min-h-11')}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Approve All
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Bar — fixed bottom on desktop, BottomSheet on mobile */}
      {isMobile ? (
        <BottomSheet
          isOpen={batchSelectedIds.length > 0}
          onClose={clearBatch}
          title={`${batchSelectedIds.length} selected`}
        >
          <div className="p-4">{barContent}</div>
        </BottomSheet>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg px-4 py-3 animate-slideUp">
          {barContent}
        </div>
      )}

      {/* Review Changes modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Changes"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You are about to approve {selectedItems.length} items:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-3 font-medium text-gray-500">Item</th>
                  <th className="text-left py-2 pr-3 font-medium text-gray-500">Sev</th>
                  <th className="text-right py-2 font-medium text-gray-500">Impact</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-gray-700 max-w-[300px] truncate">{item.title}</td>
                    <td className="py-2 pr-3 text-gray-600">{item.severity}</td>
                    <td className="py-2 text-right text-gray-700 font-medium">
                      {item.projectedImpactInr > 0 ? formatCurrency(item.projectedImpactInr) : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2 pr-3 text-gray-900">Total</td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 text-right text-gray-900">{formatCurrency(aggregateImpact)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancel</Button>
          <Button onClick={() => { setShowReviewModal(false); handleApproveAll(); }}>
            Confirm Batch
          </Button>
        </ModalFooter>
      </Modal>

      {/* High-value typed confirmation modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setConfirmText(''); }}
        title="Confirm Batch Approval"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You are approving {selectedItems.length} items with aggregate impact of{' '}
            <span className="font-semibold">{formatCurrency(aggregateImpact)}</span>.
            This exceeds the ₹1 Cr threshold.
          </p>
          <div>
            <label className="text-sm text-gray-700 font-medium" htmlFor="confirm-approve">
              Type APPROVE to confirm:
            </label>
            <Input
              id="confirm-approve"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="APPROVE"
              className="mt-1"
              aria-label="Type APPROVE to confirm"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => { setShowConfirmModal(false); setConfirmText(''); }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmApprove} disabled={confirmText !== 'APPROVE'}>
            Confirm
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
