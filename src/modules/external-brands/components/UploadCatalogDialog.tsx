import { useMemo, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  FilterMultiSelect,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useCatalogFilters, useUploadCatalog } from '../api/vendorCatalogHooks';

const ACCEPTED = '.csv,.xlsx,.xls';
const MAX_MB = 25;

interface UploadCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_SENTINEL = 'all';

function csvToList(v: string): string[] {
  if (!v || v === ALL_SENTINEL) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

export function UploadCatalogDialog({ open, onOpenChange }: UploadCatalogDialogProps): React.ReactNode {
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [seasons, setSeasons] = useState<string>(ALL_SENTINEL);
  const [classes, setClasses] = useState<string>(ALL_SENTINEL);
  const [bricks, setBricks] = useState<string>(ALL_SENTINEL);
  const [error, setError] = useState<string | null>(null);

  const { data: filters, isLoading: filtersLoading } = useCatalogFilters();
  const mutation = useUploadCatalog();

  const seasonOptions = useMemo(
    () => (filters?.seasons ?? []).map((s) => ({ value: s, label: s })),
    [filters?.seasons],
  );
  const classOptions = useMemo(
    () => (filters?.classes ?? []).map((c) => ({ value: c, label: c })),
    [filters?.classes],
  );
  const brickOptions = useMemo(
    () => (filters?.bricks ?? []).map((b) => ({ value: b, label: b })),
    [filters?.bricks],
  );

  const reset = (): void => {
    setFile(null);
    setSeasons(ALL_SENTINEL);
    setClasses(ALL_SENTINEL);
    setBricks(ALL_SENTINEL);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = (next: boolean): void => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large (max ${MAX_MB} MB)`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = (): void => {
    if (!file) {
      setError('Choose a file first');
      return;
    }
    setError(null);
    mutation.mutate(
      {
        file,
        seasons: csvToList(seasons),
        classes: csvToList(classes),
        bricks: csvToList(bricks),
      },
      {
        onSuccess: (resp) => {
          toast.success(
            `${resp.rows_inserted.toLocaleString()} rows uploaded` +
              (resp.rows_skipped ? `, ${resp.rows_skipped.toLocaleString()} skipped` : ''),
            'Catalog uploaded',
          );
          handleClose(false);
        },
        onError: (e: unknown) => {
          const msg = e instanceof Error ? e.message : 'Upload failed';
          setError(msg);
          toast.error(msg, 'Upload failed');
        },
      },
    );
  };

  const busy = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload catalog</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-500 mb-1" htmlFor="catalog-file">
              File <span className="text-gray-400">(CSV or Excel — .csv, .xlsx, .xls)</span>
            </label>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line no-restricted-syntax -- native file input required */}
              <input
                id="catalog-file"
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                onChange={handleFileChange}
                disabled={busy}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              {file && (
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-gray-500 hover:text-gray-900 p-1"
                  aria-label="Clear file"
                  title="Clear file"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {file && (
              <div className="text-[11px] text-gray-500 mt-1 truncate" title={file.name}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div>
            <div className="text-gray-500 mb-1">Season</div>
            <FilterMultiSelect
              value={seasons}
              onChange={setSeasons}
              options={seasonOptions}
              placeholder={filtersLoading ? 'Loading…' : 'All seasons'}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1">Category (Class)</div>
            <FilterMultiSelect
              value={classes}
              onChange={setClasses}
              options={classOptions}
              placeholder={filtersLoading ? 'Loading…' : 'All classes'}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1">Subcategory (Brick)</div>
            <FilterMultiSelect
              value={bricks}
              onChange={setBricks}
              options={brickOptions}
              placeholder={filtersLoading ? 'Loading…' : 'All bricks'}
            />
          </div>

          {error && (
            <p className="text-red-600 text-[11px]" role="alert">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleClose(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleUpload} disabled={busy || !file}>
            {busy ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading</>
            ) : (
              <><Upload className="h-3 w-3 mr-1" /> Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
