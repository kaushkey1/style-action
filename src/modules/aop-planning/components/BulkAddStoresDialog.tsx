import { useCallback, useRef, useState } from 'react';
import { Download, Upload, FileText } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Label } from '@/components/ui';

import type { AddStorePayload } from '../api/salesPlanApi';

interface BulkAddStoresDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (stores: AddStorePayload[]) => void;
  isUploading?: boolean;
}

// CSV template columns (in order). NSO stores are seeded from a reference store's plan.
const TEMPLATE_HEADERS = [
  'name',
  'code',
  'state',
  'city',
  'channel',
  'category',
  'type',
  'start_date',
  'reference_store_code',
  'reference_adjustment_pct',
] as const;

const TEMPLATE_EXAMPLE =
  'Superdry Phoenix Mall,,Maharashtra,MUMBAI,EBO,Menswear,A,2026-06-01,T3JO,100';

interface ParsedRow {
  row: number;
  payload?: AddStorePayload;
  error?: string;
}

// Minimal RFC-4180-ish CSV field splitter (handles quoted fields with embedded commas).
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Opening month → fiscal index (Apr=0 … Mar=11).
function fiscalIndexFromDate(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.getMonth() + 1; // 1..12
  return month >= 4 ? month - 4 : month + 8;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0] ?? '').map((h) => h.toLowerCase());
  const idx = (name: string): number => header.indexOf(name);
  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i] ?? '');
    const get = (name: string): string => {
      const at = idx(name);
      return at >= 0 ? (cols[at] ?? '').trim() : '';
    };
    const name = get('name');
    const channel = get('channel');
    const startDate = get('start_date');

    if (!name) {
      results.push({ row: i + 1, error: 'Missing store name' });
      continue;
    }
    if (!channel) {
      results.push({ row: i + 1, error: 'Missing channel' });
      continue;
    }
    let openingMonthIndex = 0;
    if (startDate) {
      const fi = fiscalIndexFromDate(startDate);
      if (fi === null) {
        results.push({ row: i + 1, error: `Invalid start_date "${startDate}" (use YYYY-MM-DD)` });
        continue;
      }
      openingMonthIndex = fi;
    }
    const refCode = get('reference_store_code');
    const adjRaw = get('reference_adjustment_pct');
    const payload: AddStorePayload = {
      name,
      storeCode: get('code') || undefined,
      state: get('state') || undefined,
      city: get('city') || undefined,
      channelId: channel,
      category: get('category') || undefined,
      grade: get('type') || undefined,
      openingMonthIndex,
      method: refCode ? 'reference' : 'waterfall',
      annualTarget: 0,
      referenceStoreCode: refCode || undefined,
      referenceAdjustmentPct: adjRaw ? Number(adjRaw) || 100 : 100,
    };
    results.push({ row: i + 1, payload });
  }
  return results;
}

export function BulkAddStoresDialog({
  isOpen,
  onClose,
  onUpload,
  isUploading = false,
}: BulkAddStoresDialogProps): React.ReactNode {
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const valid = parsed.filter((r) => r.payload);
  const invalid = parsed.filter((r) => r.error);

  const handleClose = useCallback((): void => {
    setFileName('');
    setParsed([]);
    if (inputRef.current) inputRef.current.value = '';
    onClose();
  }, [onClose]);

  function handleDownloadTemplate(): void {
    const csv = `${TEMPLATE_HEADERS.join(',')}\n${TEMPLATE_EXAMPLE}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nso-stores-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setParsed(parseCsv(String(reader.result ?? '')));
    reader.readAsText(file);
  }

  function handleUpload(): void {
    if (valid.length === 0) return;
    onUpload(valid.map((r) => r.payload as AddStorePayload));
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk upload stores (NSO)"
      description="Upload a CSV to create multiple new stores at once. New stores are seeded from a reference store's plan."
      size="lg"
    >
      <div className="space-y-4">
        {/* Template + instructions */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          {/* eslint-disable-next-line design-system/prefer-section-header -- inline info box inside a dialog, not a page-level section title */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="w-4 h-4 text-gray-400" />
              Download the template, fill one row per store, then upload it.
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4" />
              Template
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Columns: {TEMPLATE_HEADERS.join(', ')}. <span className="font-medium">name</span> and{' '}
            <span className="font-medium">channel</span> are required; <span className="font-medium">code</span>{' '}
            must not match an existing store (leave blank to auto-generate a unique one), otherwise that
            row will not be created; <span className="font-medium">reference_store_code</span> seeds the plan.
          </p>
        </div>

        {/* File picker */}
        <div>
          <Label htmlFor="bulk-store-file">CSV file</Label>
          <Input
            id="bulk-store-file"
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
          />
        </div>

        {/* Parse summary */}
        {fileName && (
          <div className="text-sm">
            <p className="text-gray-700">
              <span className="font-medium">{valid.length}</span> valid row{valid.length === 1 ? '' : 's'}
              {invalid.length > 0 && (
                <>
                  {' · '}
                  <span className="font-medium text-red-700">{invalid.length}</span> with errors
                </>
              )}
            </p>
            {invalid.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 text-xs text-red-700">
                {invalid.map((r) => (
                  <li key={r.row}>Row {r.row}: {r.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button disabled={valid.length === 0 || isUploading} onClick={handleUpload}>
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading…' : `Upload ${valid.length || ''} store${valid.length === 1 ? '' : 's'}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
