import { useState } from 'react';
import { Save } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from '@/components/ui';

interface SaveCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (comment: string) => void;
  isSaving?: boolean;
  hasError?: boolean;
  categories: Array<{ isManual: boolean; code: string }>;
}

export function SaveCommentDialog({
  open,
  onOpenChange,
  onSave,
  isSaving = false,
  hasError = false,
  categories,
}: SaveCommentDialogProps): React.ReactNode {
  const [comment, setComment] = useState('');

  const manualEdits = categories.filter((c) => c.isManual).map((c) => c.code);
  const suggestion = manualEdits.length > 0
    ? `Manual edits: ${manualEdits.join(', ')}`
    : 'Saved current state';

  const handleSave = (): void => {
    if (isSaving) return;
    onSave(comment.trim() || suggestion);
    setComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save Version</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <p className="text-sm text-gray-500">Describe what you changed in this version.</p>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={suggestion}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            aria-label="Version comment"
            disabled={isSaving}
          />
          {hasError && (
            <p className="text-sm text-red-700" aria-live="polite">Save failed. Please try again.</p>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-3.5 h-3.5 mr-1" />{isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
