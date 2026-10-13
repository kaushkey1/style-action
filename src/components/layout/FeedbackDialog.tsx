import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AttachedImage {
  id: string;
  file: File;
  preview: string;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps): React.ReactNode {
  const [text, setText] = useState('');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success } = useToast();

  const canSubmit = text.trim().length > 0;

  const addFiles = useCallback((files: FileList | File[]) => {
    const newImages: AttachedImage[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const resetForm = useCallback(() => {
    setText('');
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    resetForm();
    onOpenChange(false);
    success('Thanks for your feedback!');
  }, [canSubmit, resetForm, onOpenChange, success]);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  return (
    <Modal isOpen={open} onClose={handleClose} title="Share Feedback" size="sm">
      <div className="space-y-4">
        {/* Textarea */}
        {/* eslint-disable-next-line no-restricted-syntax -- no shared Textarea component exists in ui barrel */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus-kb:border-primary focus-kb:ring-1 focus-kb:ring-primary resize-none"
        />

        {/* Drop zone / upload trigger */}
        <div
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary-50'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50',
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          aria-label="Attach screenshot"
        >
          <ImagePlus className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-500">Attach screenshot (optional)</span>
          <span className="text-xs text-gray-400">Drop image or click to upload</span>
        </div>

        {/* eslint-disable-next-line no-restricted-syntax -- hidden file picker, not a visible form input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt={img.file.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity"
                  aria-label={`Remove ${img.file.name}`}
                >
                  <span className="absolute -inset-3" aria-hidden="true" />
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
            Send
          </Button>
        </div>
      </div>
    </Modal>
  );
}
