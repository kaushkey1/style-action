/**
 * Session log export — builds a Markdown document from session messages and
 * downloads it as a .md file, or renders a print-friendly view and opens the
 * browser print dialog for "Save as PDF" (frontend-only prototype: no PDF
 * library, so PDF goes through the native print-to-PDF path).
 */
import { formatDateTime } from '@/lib/utils';

export interface ExportMessage {
  role: string;
  content: string;
  timestamp?: number;
}

export interface SessionExportMeta {
  /** Document heading, e.g. "Session Log — t_mr0awwozo2d0n6" */
  title: string;
  /** Used for the download filename; falls back to a slug of the title */
  fileId?: string;
  model?: string;
  source?: string;
  startedAt?: number;
  endedAt?: number;
}

function roleLabel(role: string): string {
  if (role === 'user') return 'You';
  if (role === 'tool') return 'Tool';
  return 'Agent';
}

function timestampLabel(ts?: number): string {
  return ts ? formatDateTime(new Date(ts * 1000)) : '';
}

function exportFilename(meta: SessionExportMeta): string {
  const base = (meta.fileId ?? meta.title)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `session-${base}`;
}

export function sessionToMarkdown(meta: SessionExportMeta, messages: ExportMessage[]): string {
  const lines: string[] = [`# ${meta.title}`, ''];
  const facts: string[] = [];
  if (meta.model) facts.push(`- Model: ${meta.model}`);
  if (meta.source) facts.push(`- Source: ${meta.source}`);
  if (meta.startedAt) facts.push(`- Started: ${timestampLabel(meta.startedAt)}`);
  if (meta.endedAt) facts.push(`- Ended: ${timestampLabel(meta.endedAt)}`);
  if (facts.length > 0) lines.push(...facts, '');

  for (const msg of messages) {
    const time = timestampLabel(msg.timestamp);
    lines.push(`## ${roleLabel(msg.role)}${time ? ` — ${time}` : ''}`, '');
    if (msg.role === 'tool') {
      // Tool output is often raw JSON — fence it so the markdown stays readable
      lines.push('```', msg.content, '```', '');
    } else {
      lines.push(msg.content, '');
    }
  }
  return lines.join('\n');
}

export function downloadSessionMarkdown(meta: SessionExportMeta, messages: ExportMessage[]): void {
  const blob = new Blob([sessionToMarkdown(meta, messages)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${exportFilename(meta)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function downloadSessionPdf(meta: SessionExportMeta, messages: ExportMessage[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return; // popup blocked — nothing else we can do without a PDF lib

  const facts: string[] = [];
  if (meta.model) facts.push(`Model: ${escapeHtml(meta.model)}`);
  if (meta.source) facts.push(`Source: ${escapeHtml(meta.source)}`);
  if (meta.startedAt) facts.push(`Started: ${escapeHtml(timestampLabel(meta.startedAt))}`);
  if (meta.endedAt) facts.push(`Ended: ${escapeHtml(timestampLabel(meta.endedAt))}`);

  const blocks = messages
    .map((msg) => {
      const time = timestampLabel(msg.timestamp);
      const body = msg.role === 'tool'
        ? `<pre>${escapeHtml(msg.content)}</pre>`
        : `<p>${escapeHtml(msg.content)}</p>`;
      return `<section class="msg msg-${escapeHtml(msg.role)}">
        <h2>${roleLabel(msg.role)}${time ? `<span class="time">${escapeHtml(time)}</span>` : ''}</h2>
        ${body}
      </section>`;
    })
    .join('\n');

  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(exportFilename(meta))}</title>
<style>
  body { font-family: Inter, -apple-system, 'Segoe UI', sans-serif; color: #111827; margin: 32px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
  .facts { font-size: 12px; color: #6b7280; margin: 0 0 24px; }
  .msg { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; break-inside: avoid; }
  .msg h2 { font-size: 12px; font-weight: 500; margin: 0 0 6px; }
  .msg-user h2 { color: #6366f1; }
  .msg-tool h2 { color: #d97706; }
  .msg h2 .time { color: #9ca3af; font-weight: 400; margin-left: 8px; }
  .msg p { font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap; word-break: break-word; }
  .msg pre { font-size: 11px; line-height: 1.5; margin: 0; white-space: pre-wrap; word-break: break-word; background: #f9fafb; border-radius: 6px; padding: 8px; }
</style>
</head>
<body>
<h1>${escapeHtml(meta.title)}</h1>
${facts.length > 0 ? `<p class="facts">${facts.join(' &nbsp;·&nbsp; ')}</p>` : ''}
${blocks}
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  // Give the new document a frame to layout before opening the print dialog
  printWindow.setTimeout(() => printWindow.print(), 150);
}
