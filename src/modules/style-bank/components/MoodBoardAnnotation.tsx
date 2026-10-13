import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// ── Props ───────────────────────────────────────────────────────────────

interface MoodBoardAnnotationProps {
  annotation?: { note: string; author: string; updatedAt: string };
  onSave: (note: string) => void;
  maxLength?: number;
  className?: string;
}

// ── Component ───────────────────────────────────────────────────────────

export function MoodBoardAnnotation({
  annotation,
  onSave,
  maxLength = 140,
  className,
}: MoodBoardAnnotationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(annotation?.note ?? '');
  const [showTooltip, setShowTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when editing opens
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // ── Handlers ────────────────────────────────────────────────────────

  const handleOpen = () => {
    setDraft(annotation?.note ?? '');
    setIsEditing(true);
    setShowTooltip(false);
  };

  const handleSave = () => {
    onSave(draft.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(annotation?.note ?? '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // ── Inline editor ──────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div
        className={cn(
          'absolute inset-0 z-20 bg-white rounded-lg border border-gray-200 shadow-lg p-2 flex flex-col',
          className
        )}
      >
        {/* eslint-disable-next-line no-restricted-syntax -- no Textarea primitive yet */}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setDraft(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 text-xs text-gray-700 border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary"
          placeholder="Add a note..."
          rows={3}
        />
        {/* eslint-disable-next-line design-system/prefer-section-header -- inline editor footer with char counter and action buttons */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">
            {draft.length}/{maxLength}
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 px-2 text-xs">
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave} className="h-6 px-2 text-xs">
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Existing annotation: note icon with hover tooltip ──────────────

  if (annotation) {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={handleOpen}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          aria-label="View annotation"
        >
          <MessageSquare className="w-3 h-3" />
        </button>

        {/* CSS tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-30 w-48 pointer-events-none">
            <div className="bg-gray-900 text-white text-[10px] leading-relaxed rounded-lg p-2 shadow-lg">
              <p className="line-clamp-3">{annotation.note}</p>
              <p className="text-gray-400 mt-1">
                {annotation.author}
              </p>
            </div>
            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── No annotation: add button ─────────────────────────────────────

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
        aria-label="Add annotation"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
