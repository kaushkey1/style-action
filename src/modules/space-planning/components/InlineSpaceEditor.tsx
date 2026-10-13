import { useState, useRef, useEffect, useCallback } from 'react';
import { cn, formatNumber } from '@/lib/utils';

interface InlineSpaceEditorProps {
  value: number;
  min: number;
  /** Optional ceiling. Omit for min-only editing (category MAX was removed). */
  max?: number;
  onCommit: (value: number) => void;
  onCancel: () => void;
  validate?: (value: number) => { valid: boolean; message: string; clampedValue?: number };
}

export function InlineSpaceEditor({
  value,
  min,
  max,
  onCommit,
  onCancel,
  validate,
}: InlineSpaceEditorProps): React.ReactNode {
  const [inputValue, setInputValue] = useState(String(value));
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isCommittingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    setInputValue(raw);

    const num = Number(raw);
    if (Number.isNaN(num) || raw === '') {
      setError('Enter a valid number');
      return;
    }

    if (validate) {
      const result = validate(num);
      setError(result.valid ? '' : result.message);
    } else if (num < min) {
      setError(`Below minimum (${formatNumber(min)})`);
    } else if (max !== undefined && num > max) {
      setError(`Above maximum (${formatNumber(max)})`);
    } else {
      setError('');
    }
  }, [min, max, validate]);

  const doCommit = useCallback(() => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;

    const num = Number(inputValue.replace(/,/g, ''));
    if (Number.isNaN(num)) { onCancel(); return; }

    if (validate) {
      const result = validate(num);
      if (!result.valid && result.clampedValue !== undefined) {
        onCommit(result.clampedValue);
        return;
      }
      if (!result.valid) { onCancel(); return; }
    } else if (num < min || (max !== undefined && num > max)) {
      onCancel();
      return;
    }

    onCommit(num);
  }, [inputValue, min, max, onCommit, onCancel, validate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doCommit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [doCommit, onCancel]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!isCommittingRef.current) {
        onCancel();
      }
    }, 150);
  }, [onCancel]);

  const parsed = Number(inputValue.replace(/,/g, ''));
  const hasError = error.length > 0 || Number.isNaN(parsed);

  const stopMouseDown = (e: React.MouseEvent): void => e.stopPropagation();

  return (
    // Keep the in-flow footprint the size of the input only — hints/errors float
    // in an anchored popover so entering edit mode never shifts the column.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- stopPropagation prevents parent row click from interfering with inline editor
    <div className="relative inline-block" onMouseDown={stopMouseDown}>
      {/* eslint-disable-next-line no-restricted-syntax -- inline edit cell requires ref-based auto-select and custom validation styling not supported by <Input> */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          'w-24 px-2 py-1 text-sm font-mono rounded border text-right',
          hasError ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900 focus-kb:border-primary focus-kb:ring-1 focus-kb:ring-primary/30',
        )}
        aria-label="Edit space value"
      />
      <div className="absolute right-0 top-full mt-1 z-20 w-60 rounded-lg border border-gray-200 bg-white shadow-lg p-2 text-left space-y-1">
        <p className="text-xs text-gray-400">
          {max !== undefined ? `range ${formatNumber(min)}–${formatNumber(max)}` : `min ${formatNumber(min)}`}
          <span className="mx-1">·</span>Enter to apply · Esc to cancel
        </p>
        {error && (
          <p className="text-xs text-red-700" aria-live="polite">{error}</p>
        )}
      </div>
    </div>
  );
}
