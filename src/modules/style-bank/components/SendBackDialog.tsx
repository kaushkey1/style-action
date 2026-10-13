import { useState, useCallback } from 'react';
import { Send, MessageSquare, Flag } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface SendBackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  podId: string;
  podName: string;
  styles: Array<{ id: string; name: string; margin: number }>;
  onSendBack: (
    generalComment: string,
    flaggedStyles: Array<{ styleId: string; comment: string }>
  ) => void;
}

interface FlaggedStyle {
  styleId: string;
  checked: boolean;
  comment: string;
}

export function SendBackDialog({
  isOpen,
  onClose,
  podName,
  styles,
  onSendBack,
}: SendBackDialogProps) {
  const [generalComment, setGeneralComment] = useState('');
  const [flaggedStyles, setFlaggedStyles] = useState<FlaggedStyle[]>(() =>
    styles.map((s) => ({ styleId: s.id, checked: false, comment: '' }))
  );

  const flaggedCount = flaggedStyles.filter((s) => s.checked).length;

  const handleToggleStyle = useCallback((styleId: string) => {
    setFlaggedStyles((prev) =>
      prev.map((s) =>
        s.styleId === styleId
          ? { ...s, checked: !s.checked, comment: s.checked ? '' : s.comment }
          : s
      )
    );
  }, []);

  const handleStyleComment = useCallback(
    (styleId: string, comment: string) => {
      setFlaggedStyles((prev) =>
        prev.map((s) => (s.styleId === styleId ? { ...s, comment } : s))
      );
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const flagged = flaggedStyles
      .filter((s) => s.checked)
      .map((s) => ({ styleId: s.styleId, comment: s.comment }));
    onSendBack(generalComment, flagged);
    setGeneralComment('');
    setFlaggedStyles((prev) =>
      prev.map((s) => ({ ...s, checked: false, comment: '' }))
    );
    onClose();
  }, [flaggedStyles, generalComment, onSendBack, onClose]);

  const handleClose = useCallback(() => {
    setGeneralComment('');
    setFlaggedStyles((prev) =>
      prev.map((s) => ({ ...s, checked: false, comment: '' }))
    );
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Send Back \u2014 ${podName}`}
      description="You are sending this collection back to the Buyer for revision."
      size="lg"
    >
      <div className="space-y-4">
        {/* General Feedback */}
        <div className="space-y-1.5">
          <label
            htmlFor="general-feedback"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            <MessageSquare className="w-3 h-3" />
            General Feedback
          </label>
          {/* eslint-disable-next-line no-restricted-syntax -- no Textarea primitive yet */}
          <textarea
            id="general-feedback"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- user-initiated modal, autofocus expected
            autoFocus
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            placeholder="Describe what needs revision..."
            rows={4}
            className={cn(
              'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900',
              'placeholder:text-gray-500 resize-none',
              'focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary',
              'transition-colors'
            )}
          />
        </div>

        {/* Flag Specific Styles */}
        <div className="space-y-2">
          {/* eslint-disable-next-line design-system/prefer-section-header -- inline label with dynamic badge count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Flag className="w-3 h-3" />
              Flag Specific Styles
            </span>
            {flaggedCount > 0 && (
              <Badge variant="warning" size="sm">
                {flaggedCount} style{flaggedCount !== 1 ? 's' : ''} flagged for revision
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
            {styles.map((style) => {
              const flagged = flaggedStyles.find(
                (f) => f.styleId === style.id
              );
              const isChecked = flagged?.checked ?? false;

              return (
                <div key={style.id} className="px-3 py-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    {/* eslint-disable-next-line no-restricted-syntax -- checkbox, not a text input */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleStyle(style.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus-kb:ring-primary/20"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900">
                        {style.name}
                      </span>
                      <span
                        className={cn(
                          'ml-2 text-xs font-medium',
                          style.margin >= 53
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {style.margin}% margin
                      </span>
                    </div>
                  </label>

                  {isChecked && (
                    <div className="mt-2 ml-7">
                      <Input
                        value={flagged?.comment ?? ''}
                        onChange={(e) =>
                          handleStyleComment(style.id, e.target.value)
                        }
                        placeholder="Comment on this style..."
                        className="bg-gray-50 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={generalComment.trim().length === 0}
          onClick={handleSubmit}
        >
          <Send className="w-4 h-4 mr-2" />
          Send Back
        </Button>
      </ModalFooter>
    </Modal>
  );
}
