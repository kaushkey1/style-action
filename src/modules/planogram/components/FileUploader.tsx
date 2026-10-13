import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanogramStore } from '../stores/usePlanogramStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function FileUploader(): React.ReactNode {
  const uploadFile = usePlanogramStore((s) => s.uploadFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  function validateFile(file: File): string | null {
    if (!file.name.endsWith('.xlsx')) {
      return 'Only .xlsx files are accepted.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB.';
    }
    return null;
  }

  function handleFile(file: File): void {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      return;
    }
    setFileError(null);
    uploadFile(file);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'w-full border-2 border-dashed rounded-lg p-4 text-center transition-colors',
          'border-gray-300 hover:border-gray-400 cursor-pointer',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* eslint-disable-next-line no-restricted-syntax -- Need raw input for file upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-3">
          <Upload className="w-12 h-12 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Drag & Drop Modified Excel Here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or <span className="text-primary">browse files</span>
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Supported format: .xlsx &middot; Max file size: 10MB
          </p>
        </div>
      </button>

      {fileError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <FileSpreadsheet className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{fileError}</p>
        </div>
      )}
    </div>
  );
}
