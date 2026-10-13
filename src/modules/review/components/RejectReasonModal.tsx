import { useState } from 'react';
import { Button, Modal, ModalFooter, Input } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BottomSheet } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getRejectReasonCodes } from '../data/mockReviewData';
import type { ExceptionDomain } from '@/modules/exceptions/data/mockExceptions';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonCode: string, note: string) => void;
  itemTitle: string;
  domain: ExceptionDomain;
}

export function RejectReasonModal({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  domain,
}: RejectReasonModalProps): React.ReactNode {
  const [selectedReason, setSelectedReason] = useState('');
  const [note, setNote] = useState('');
  const isMobile = useIsMobile();

  const reasons = getRejectReasonCodes(domain);

  const handleConfirm = (): void => {
    if (!selectedReason) return;
    onConfirm(selectedReason, note);
    setSelectedReason('');
    setNote('');
  };

  const handleClose = (): void => {
    setSelectedReason('');
    setNote('');
    onClose();
  };

  const content = (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Reason (required)</p>
        <div className="space-y-1">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={cn(
                'flex items-center w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                isMobile && 'min-h-12',
                selectedReason === reason
                  ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50',
              )}
            >
              <span className="flex-1">{reason}</span>
              {selectedReason === reason && (
                <span className="shrink-0 w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500" htmlFor="reject-note">
          Additional notes (optional)
        </label>
        <Input
          id="reject-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add context..."
          className="mt-1"
          aria-label="Additional notes"
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={`Reject: ${itemTitle}`}
        zIndex={50}
      >
        <div className="p-4">
          {content}
          <div className="mt-4">
            <Button
              className="w-full min-h-11"
              onClick={handleConfirm}
              disabled={!selectedReason}
              variant="destructive"
            >
              Reject Item
            </Button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Reject: ${itemTitle}`}>
      {content}
      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button variant="destructive" onClick={handleConfirm} disabled={!selectedReason}>
          Reject Item
        </Button>
      </ModalFooter>
    </Modal>
  );
}
