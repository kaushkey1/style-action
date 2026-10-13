import { useState } from 'react';
import { Modal, ModalFooter, Button, Input, Label } from '@/components/ui';

interface AddChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (channel: { name: string; target: number; gmPct: number }) => void;
  existingChannels: string[];
  isSaving?: boolean;
}

export function AddChannelDialog({
  isOpen,
  onClose,
  onAdd,
  existingChannels,
  isSaving = false,
}: AddChannelDialogProps): React.ReactNode {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [gmPct, setGmPct] = useState('');

  const trimmed = name.trim();
  const duplicate =
    trimmed.length > 0 &&
    existingChannels.some((c) => c.trim().toLowerCase() === trimmed.toLowerCase());
  const isValid = trimmed.length > 0 && !duplicate;

  function reset(): void {
    setName('');
    setTarget('');
    setGmPct('');
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  function handleAdd(): void {
    if (!isValid) return;
    onAdd({ name: trimmed, target: parseFloat(target) || 0, gmPct: parseFloat(gmPct) || 0 });
    reset();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add channel"
      description="Add a new channel to this cycle. Stores you assign to it will roll up into the plan."
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="add-channel-name">Channel name *</Label>
          <Input
            id="add-channel-name"
            placeholder="e.g. Marketplace"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className={`mt-1 text-xs ${duplicate ? 'text-red-700' : 'text-gray-500'}`}>
            {duplicate
              ? 'A channel with this name already exists in this cycle.'
              : 'Must be unique within this cycle.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-channel-target">GSV target (₹ Cr)</Label>
            <Input
              id="add-channel-target"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="add-channel-gm">GM% target</Label>
            <Input
              id="add-channel-gm"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="0"
              value={gmPct}
              onChange={(e) => setGmPct(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          The target is a starting value — once stores are created in this channel and the plan is
          generated, the channel total is driven by those stores.
        </p>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button disabled={!isValid || isSaving} onClick={handleAdd}>
          {isSaving ? 'Adding…' : 'Add channel'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
