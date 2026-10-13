import { useState } from 'react';
import { Modal, ModalFooter, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { StoreListing } from '../types/aopPlanning.types';

interface RemoveStoreDialogProps {
  store: StoreListing | null;
  isOpen: boolean;
  onClose: () => void;
  onTempClosure: (store: StoreListing) => void;
  onFullClosure: (store: StoreListing) => void;
  onRelocation: (store: StoreListing) => void;
}

type ClosureSelection = 'temporary' | 'full' | 'relocation' | null;

export function RemoveStoreDialog({
  store,
  isOpen,
  onClose,
  onTempClosure,
  onFullClosure,
  onRelocation,
}: RemoveStoreDialogProps): React.ReactNode {
  const [selected, setSelected] = useState<ClosureSelection>(null);

  function handleClose(): void {
    setSelected(null);
    onClose();
  }

  function handleConfirm(): void {
    if (!store || !selected) return;
    if (selected === 'temporary') {
      onTempClosure(store);
    } else if (selected === 'relocation') {
      onRelocation(store);
    } else {
      onFullClosure(store);
    }
    setSelected(null);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Remove store"
      description="Choose the type of closure you want to proceed with"
      size="md"
    >
      <div className="space-y-3">
        <button
          type="button"
          className={cn(
            'w-full rounded-lg border p-4 text-left transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selected === 'temporary'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300',
          )}
          onClick={() => setSelected('temporary')}
          aria-pressed={selected === 'temporary'}
        >
          <p className="text-sm font-semibold text-gray-900">Renovation (temporary closure)</p>
          <p className="text-xs text-gray-500 mt-1">
            Sales will be paused only for the renovation period and resume automatically after.
          </p>
        </button>

        <button
          type="button"
          className={cn(
            'w-full rounded-lg border p-4 text-left transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selected === 'relocation'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300',
          )}
          onClick={() => setSelected('relocation')}
          aria-pressed={selected === 'relocation'}
        >
          <p className="text-sm font-semibold text-gray-900">Relocation</p>
          <p className="text-xs text-gray-500 mt-1">
            The store moves to a new site and is planned as a new store from the relocation date.
          </p>
        </button>

        <button
          type="button"
          className={cn(
            'w-full rounded-lg border p-4 text-left transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            selected === 'full'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300',
          )}
          onClick={() => setSelected('full')}
          aria-pressed={selected === 'full'}
        >
          <p className="text-sm font-semibold text-gray-900">Full closure</p>
          <p className="text-xs text-gray-500 mt-1">
            The store will be excluded from all future planning and calculations beyond the end date.
          </p>
        </button>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          disabled={!selected}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </ModalFooter>
    </Modal>
  );
}
