import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Textarea, Label } from '@/components/ui';

import type { StoreListing } from '../types/aopPlanning.types';

interface TempClosureDialogProps {
  store: StoreListing | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (storeId: string, closeDate: string, reopenDate: string, reason: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function TempClosureDialog({
  store,
  isOpen,
  onClose,
  onConfirm,
  minDate,
  maxDate,
}: TempClosureDialogProps): React.ReactNode {
  const [closeDate, setCloseDate] = useState('');
  const [reopenDate, setReopenDate] = useState('');
  const [reason, setReason] = useState('Renovation');
  const [errors, setErrors] = useState<{ closeDate?: string; reopenDate?: string; reason?: string }>({});

  function handleClose(): void {
    setCloseDate('');
    setReopenDate('');
    setReason('Renovation');
    setErrors({});
    onClose();
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!closeDate) {
      newErrors.closeDate = 'Close date is required';
    }
    if (!reopenDate) {
      newErrors.reopenDate = 'Reopen date is required';
    } else if (closeDate && reopenDate && new Date(reopenDate) <= new Date(closeDate)) {
      newErrors.reopenDate = 'Reopen date must be after close date';
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
    onConfirm(store.id, closeDate, reopenDate, reason.trim());
    handleClose();
  }

  const isValid = closeDate.length > 0
    && reopenDate.length > 0
    && reason.trim().length > 0
    && (!closeDate || !reopenDate || new Date(reopenDate) > new Date(closeDate));

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
            <h2 className="text-lg font-semibold text-gray-900">Remove store - Renovation</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              This action will pause sales and planning for the renovation period only and the store
              will automatically reopen and be included in plans again after the renovation ends.
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
                <span className="text-xs text-gray-500">State</span>
                <p className="font-medium text-gray-900">{store.state}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">City</span>
                <p className="font-medium text-gray-900">{store.city}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="temp-close-date">Store close date *</Label>
            <Input
              id="temp-close-date"
              type="date"
              value={closeDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setCloseDate(e.target.value)}
              error={errors.closeDate}
            />
          </div>
          <div>
            <Label htmlFor="temp-reopen-date">Store open date *</Label>
            <Input
              id="temp-reopen-date"
              type="date"
              value={reopenDate}
              min={closeDate || minDate}
              max={maxDate}
              onChange={(e) => setReopenDate(e.target.value)}
              error={errors.reopenDate}
            />
          </div>
        </div>
        {minDate && maxDate && (
          <p className="text-xs text-gray-400">Dates within the plan year ({minDate} to {maxDate}).</p>
        )}

        <div>
          <Label htmlFor="temp-closure-reason">Reason for renovation *</Label>
          <Textarea
            id="temp-closure-reason"
            placeholder="Add reason for renovation"
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
          Confirm renovation
        </Button>
      </ModalFooter>
    </Modal>
  );
}
