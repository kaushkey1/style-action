import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Textarea, Label } from '@/components/ui';

import type { StoreListing } from '../types/aopPlanning.types';

interface FullClosureDialogProps {
  store: StoreListing | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (storeId: string, endDate: string, reason: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function FullClosureDialog({
  store,
  isOpen,
  onClose,
  onConfirm,
  minDate,
  maxDate,
}: FullClosureDialogProps): React.ReactNode {
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ endDate?: string; reason?: string }>({});

  function handleClose(): void {
    setEndDate('');
    setReason('');
    setErrors({});
    onClose();
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleConfirm(): void {
    if (!store) return;
    if (!validate()) return;
    onConfirm(store.id, endDate, reason.trim());
    handleClose();
  }

  const isValid = endDate.length > 0 && reason.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      <div className="space-y-4">
        {/* Custom title with back arrow */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Remove store - Full closure</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Add the closing date of the store and add a reason to remove store
            </p>
          </div>
        </div>

        {/* Store info row */}
        {store && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500">Store</span>
                <p className="font-medium text-gray-900">{store.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">City</span>
                <p className="font-medium text-gray-900">{store.city}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Start Date</span>
                <p className="font-medium text-gray-900">{store.startDate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form fields */}
        <div>
          <Label htmlFor="full-end-date">Store end date *</Label>
          <Input
            id="full-end-date"
            type="date"
            value={endDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={errors.endDate}
          />
          {minDate && maxDate && (
            <p className="text-xs text-gray-400 mt-1">Within the plan year ({minDate} to {maxDate}).</p>
          )}
        </div>

        <div>
          <Label htmlFor="full-closure-reason">Reason for closure *</Label>
          <Textarea
            id="full-closure-reason"
            placeholder="Add reason for closure"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            error={errors.reason}
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={!isValid}
          onClick={handleConfirm}
        >
          Confirm full closure
        </Button>
      </ModalFooter>
    </Modal>
  );
}
