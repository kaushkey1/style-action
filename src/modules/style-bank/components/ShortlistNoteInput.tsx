import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Props ───────────────────────────────────────────────────────────────

interface ShortlistNoteInputProps {
  action: 'shortlisted' | 'rejected';
  onSubmit: (note: string) => void;
  onDismiss: () => void;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 3000;

const REJECTION_REASONS = [
  'Margin below threshold',
  'Does not fit brand aesthetic',
  'Duplicate / similar style exists',
  'Poor quality or finish',
  'Price point mismatch',
  'Not aligned with season theme',
  'Insufficient size coverage',
  'Fabric not in approved palette',
] as const;

// ── Component ───────────────────────────────────────────────────────────

export function ShortlistNoteInput({
  action,
  onSubmit,
  onDismiss,
  className,
}: ShortlistNoteInputProps) {
  const [note, setNote] = useState('');
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auto-dismiss logic ──────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);
  }, [clearTimer, onDismiss]);

  // Start the auto-dismiss timer on mount
  useEffect(() => {
    startTimer();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  // Pause the timer when focused or text is entered
  useEffect(() => {
    if (focused || note.length > 0) {
      clearTimer();
    }
  }, [focused, note, clearTimer]);

  // ── Handlers ────────────────────────────────────────────────────────

  const handleSubmit = () => {
    clearTimer();
    onSubmit(note);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  const isShortlisted = action === 'shortlisted';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status indicator */}
      <p
        className={cn(
          'text-xs font-semibold',
          isShortlisted ? 'text-green-600' : 'text-red-600'
        )}
      >
        {isShortlisted ? 'Shortlisted' : 'Rejected'}
      </p>

      {/* Note input (shortlist) or reason dropdown (reject) + save button */}
      <div className="flex items-center gap-2">
        {isShortlisted ? (
          <Input
            ref={inputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Why are you shortlisting? (optional)"
            className="py-1.5 text-xs flex-1"
          />
        ) : (
          <Select
            value={note}
            onValueChange={(value) => { setNote(value); clearTimer(); }}
            onOpenChange={(open) => { setFocused(open); }}
          >
            <SelectTrigger className="flex-1 py-1.5 text-xs">
              <SelectValue placeholder="Select reason for rejection" />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={() => { clearTimer(); onDismiss(); }}>
          Cancel
        </Button>
        <Button size="sm" variant="primary" onClick={handleSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
}
