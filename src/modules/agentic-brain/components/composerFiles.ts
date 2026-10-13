/**
 * Composer file-attachment rules — single source of truth for the file input's
 * accept attribute, drag-and-drop filtering, and per-type visual identity
 * (kept outside AiComposer.tsx so the component file only exports components,
 * preserving Fast Refresh).
 */
import { File as FileIcon, FileImage, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Non-image extensions the composer accepts. */
export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.csv', '.json', '.txt', '.md'] as const;

export const FILE_INPUT_ACCEPT = ['image/*', ...ACCEPTED_FILE_EXTENSIONS].join(',');

export function isAcceptedFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const name = file.name.toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Visual identity per file type — canonical brand-associated tints
    (PDF red, Word blue, Excel/CSV green, JSON amber, images purple). */
export interface FileVisual {
  icon: LucideIcon;
  /** Classes for the icon tile: tint background + icon colour. */
  tileClass: string;
  /** Short uppercase type label shown under the file name. */
  label: string;
}

const FILE_VISUALS: Record<string, FileVisual> = {
  pdf: { icon: FileText, tileClass: 'bg-red-50 text-red-600', label: 'PDF' },
  doc: { icon: FileText, tileClass: 'bg-blue-50 text-blue-600', label: 'DOC' },
  docx: { icon: FileText, tileClass: 'bg-blue-50 text-blue-600', label: 'DOCX' },
  xls: { icon: FileSpreadsheet, tileClass: 'bg-green-50 text-green-600', label: 'XLS' },
  xlsx: { icon: FileSpreadsheet, tileClass: 'bg-green-50 text-green-600', label: 'XLSX' },
  csv: { icon: FileSpreadsheet, tileClass: 'bg-green-50 text-green-600', label: 'CSV' },
  json: { icon: FileJson, tileClass: 'bg-amber-50 text-amber-600', label: 'JSON' },
  txt: { icon: FileText, tileClass: 'bg-gray-100 text-gray-600', label: 'TXT' },
  md: { icon: FileText, tileClass: 'bg-gray-100 text-gray-600', label: 'MD' },
};

const IMAGE_VISUAL: FileVisual = { icon: FileImage, tileClass: 'bg-purple-50 text-purple-600', label: 'IMAGE' };
const GENERIC_VISUAL: FileVisual = { icon: FileIcon, tileClass: 'bg-gray-100 text-gray-600', label: 'FILE' };
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'svg', 'bmp', 'tiff']);

export function getFileVisual(file: { name: string; type?: string }): FileVisual {
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (file.type?.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) {
    return { ...IMAGE_VISUAL, label: ext ? ext.toUpperCase() : IMAGE_VISUAL.label };
  }
  return FILE_VISUALS[ext] ?? GENERIC_VISUAL;
}
