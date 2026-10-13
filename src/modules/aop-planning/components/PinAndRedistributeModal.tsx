import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Modal, ModalFooter, Button, Input } from '@/components/ui';

interface PinAndRedistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  monthLabel: string;
  currentValue: number;
  channelTotal: number;
  onConfirm: (newValue: number) => void;
}

function formatCrValue(value: number): string {
  return `${value.toFixed(2)} Cr`;
}

export function PinAndRedistributeModal({
  isOpen,
  onClose,
  storeName,
  monthLabel,
  currentValue,
  channelTotal,
  onConfirm,
}: PinAndRedistributeModalProps): React.ReactNode {
  const [newValue, setNewValue] = useState<string>(currentValue.toFixed(2));

  const parsedValue = parseFloat(newValue);
  const isValid = !Number.isNaN(parsedValue) && parsedValue >= 0;
  const remainingValue = isValid ? channelTotal - parsedValue : channelTotal - currentValue;

  const handleConfirm = useCallback(() => {
    if (isValid) {
      onConfirm(parsedValue);
      onClose();
    }
  }, [isValid, parsedValue, onConfirm, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  }, [handleConfirm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pin value — ${storeName}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Current value display */}
        <div className="rounded-lg bg-gray-50 p-3">
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-sm text-gray-600">
              Current value ({monthLabel})
            </dt>
            <dd className="text-sm font-semibold text-gray-900 tabular-nums text-right">
              {formatCrValue(currentValue)}
            </dd>
          </dl>
        </div>

        {/* New value input */}
        <div>
          <Input
            label="New pinned value (Cr)"
            type="number"
            step="0.01"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Preview text */}
        {isValid && (
          <div
            className={cn(
              'rounded-lg border border-blue-200 bg-blue-50 p-3',
              'text-sm text-gray-700',
            )}
          >
            <span className="font-medium text-gray-900">{storeName}</span>
            {' pinned at '}
            <span className="font-semibold tabular-nums">
              {formatCrValue(parsedValue)}
            </span>
            {'. Redistributing the remaining '}
            <span className="font-semibold tabular-nums">
              {formatCrValue(remainingValue)}
            </span>
            {' across other stores. Channel total unchanged ('}
            <span className="font-semibold tabular-nums">
              {formatCrValue(channelTotal)}
            </span>
            {').'}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!isValid}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </ModalFooter>
    </Modal>
  );
}
