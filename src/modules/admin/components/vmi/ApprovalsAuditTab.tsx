import { useMemo, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, toCsv, downloadTextFile } from '@/lib/utils';
import { useVmiConfigStore } from '../../stores/useVmiConfigStore';
import {
  VMI_STATUSES,
  newRowId,
  type EnrolmentRow,
  type VendorMoqRow,
  type VmiStatus,
} from '../../data/vmiConfigSeed';
import { AdminSectionCard } from './shared';

type BulkGroup = 'enrolment' | 'vendorMoq';

const TEMPLATES: Record<BulkGroup, string[]> = {
  enrolment: ['styleId', 'optionCode', 'ean', 'brand', 'segment', 'autoReorder', 'status', 'effectiveFrom', 'effectiveTo'],
  vendorMoq: ['ean', 'vendorCode', 'vendorName', 'moq', 'status', 'effectiveFrom', 'effectiveTo'],
};

const GROUP_LABEL: Record<BulkGroup, string> = {
  enrolment: 'Enrolment',
  vendorMoq: 'Vendor & MOQ',
};

interface ParseOutput {
  total: number;
  accepted: number;
  rejected: number;
  warnings: number;
  enrolmentRows: EnrolmentRow[];
  vendorRows: VendorMoqRow[];
  errors: { row: number; reason: string }[];
}

function parseBool(v: string): boolean {
  return ['true', '1', 'yes', 'y'].includes(v.trim().toLowerCase());
}

function coerceStatus(v: string): { status: VmiStatus; warned: boolean } {
  const s = v.trim();
  if (!s) return { status: 'Pending', warned: false };
  if ((VMI_STATUSES as string[]).includes(s)) return { status: s as VmiStatus, warned: false };
  return { status: 'Pending', warned: true };
}

function parseCsv(group: BulkGroup, text: string): ParseOutput {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ParseOutput = { total: 0, accepted: 0, rejected: 0, warnings: 0, enrolmentRows: [], vendorRows: [], errors: [] };
  if (lines.length < 2) {
    out.errors.push({ row: 0, reason: 'File has a header but no data rows.' });
    return out;
  }
  const header = (lines[0] ?? '').split(',').map((h) => h.trim());
  const get = (cells: string[], name: string): string => {
    const idx = header.indexOf(name);
    return idx >= 0 ? (cells[idx] ?? '').trim() : '';
  };

  const data = lines.slice(1);
  out.total = data.length;

  data.forEach((line, i) => {
    const cells = line.split(',');
    const rowNum = i + 2;

    if (group === 'enrolment') {
      const ean = get(cells, 'ean');
      const styleId = get(cells, 'styleId');
      if (!ean) {
        out.errors.push({ row: rowNum, reason: 'missing EAN' });
        out.rejected += 1;
        return;
      }
      if (!styleId) {
        out.errors.push({ row: rowNum, reason: 'missing styleId' });
        out.rejected += 1;
        return;
      }
      const { status, warned } = coerceStatus(get(cells, 'status'));
      if (warned) {
        out.warnings += 1;
        out.errors.push({ row: rowNum, reason: `unknown status → defaulted to ${status}` });
      }
      out.enrolmentRows.push({
        id: newRowId('enr'),
        styleId,
        optionCode: get(cells, 'optionCode'),
        ean,
        brand: get(cells, 'brand'),
        segment: get(cells, 'segment'),
        autoReorder: parseBool(get(cells, 'autoReorder')),
        status,
        effectiveFrom: get(cells, 'effectiveFrom'),
        effectiveTo: get(cells, 'effectiveTo'),
      });
      out.accepted += 1;
      return;
    }

    // vendorMoq
    const ean = get(cells, 'ean');
    const vendorCode = get(cells, 'vendorCode');
    const moqNum = Number(get(cells, 'moq'));
    if (!ean) {
      out.errors.push({ row: rowNum, reason: 'missing EAN' });
      out.rejected += 1;
      return;
    }
    if (!vendorCode) {
      out.errors.push({ row: rowNum, reason: 'missing vendorCode' });
      out.rejected += 1;
      return;
    }
    if (!Number.isInteger(moqNum) || moqNum < 1) {
      out.errors.push({ row: rowNum, reason: 'MOQ must be a positive whole number' });
      out.rejected += 1;
      return;
    }
    const { status, warned } = coerceStatus(get(cells, 'status'));
    if (warned) {
      out.warnings += 1;
      out.errors.push({ row: rowNum, reason: `unknown status → defaulted to ${status}` });
    }
    out.vendorRows.push({
      id: newRowId('vmq'),
      ean,
      vendorCode,
      vendorName: get(cells, 'vendorName'),
      moq: moqNum,
      status,
      effectiveFrom: get(cells, 'effectiveFrom'),
      effectiveTo: get(cells, 'effectiveTo'),
    });
    out.accepted += 1;
  });

  return out;
}

/** R10 — Approvals, Audit, Readiness & Bulk Upload. */
export function ApprovalsAuditTab(): React.ReactNode {
  const enrolment = useVmiConfigStore((s) => s.enrolment);
  const vendorMoq = useVmiConfigStore((s) => s.vendorMoq);
  const storeSto = useVmiConfigStore((s) => s.storeSto);
  const dcPo = useVmiConfigStore((s) => s.dcPo);
  const leadTimes = useVmiConfigStore((s) => s.leadTimes);
  const auditLog = useVmiConfigStore((s) => s.auditLog);
  const lastModified = useVmiConfigStore((s) => s.lastModified);
  const setEnrolment = useVmiConfigStore((s) => s.setEnrolment);
  const setVendorMoq = useVmiConfigStore((s) => s.setVendorMoq);
  const recordAudit = useVmiConfigStore((s) => s.recordAudit);
  const { success: toastSuccess } = useToast();

  // ── Configuration readiness ──
  const readiness = useMemo(() => {
    const leadReady = leadTimes.dcToStore !== null && leadTimes.vendorToDc !== null;
    const activeVendorEans = new Set(vendorMoq.filter((v) => v.status === 'Active').map((v) => v.ean.trim()));
    const activeStoreEans = new Set(storeSto.rows.filter((r) => r.status === 'Active').map((r) => r.ean.trim()));
    const activeDcEans = new Set(dcPo.rows.filter((r) => r.status === 'Active').map((r) => r.ean.trim()));

    return enrolment
      .filter((e) => e.status === 'Active' && e.autoReorder)
      .map((e) => {
        const missing: string[] = [];
        if (!activeVendorEans.has(e.ean.trim())) missing.push('Vendor/MOQ');
        if (!activeStoreEans.has(e.ean.trim())) missing.push('Store rule');
        if (!activeDcEans.has(e.ean.trim())) missing.push('DC rule');
        if (!leadReady) missing.push('Lead times');
        return { ean: e.ean, style: e.styleId, missing };
      });
  }, [enrolment, vendorMoq, storeSto, dcPo, leadTimes]);

  const readyCount = readiness.filter((r) => r.missing.length === 0).length;

  // ── Bulk upload ──
  const [group, setGroup] = useState<BulkGroup>('enrolment');
  const [parsed, setParsed] = useState<ParseOutput | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    setParsed(parseCsv(group, text));
    input.value = '';
  }

  function handleImport(): void {
    if (!parsed) return;
    if (group === 'enrolment' && parsed.enrolmentRows.length > 0) {
      setEnrolment([...enrolment, ...parsed.enrolmentRows]);
      recordAudit('Enrolment', 'Imported', `${parsed.enrolmentRows.length} rows via bulk upload`);
      toastSuccess(`Imported ${parsed.enrolmentRows.length} enrolment rows.`);
    } else if (group === 'vendorMoq' && parsed.vendorRows.length > 0) {
      setVendorMoq([...vendorMoq, ...parsed.vendorRows]);
      recordAudit('Vendor & MOQ', 'Imported', `${parsed.vendorRows.length} rows via bulk upload`);
      toastSuccess(`Imported ${parsed.vendorRows.length} vendor rows.`);
    }
    setParsed(null);
  }

  function handleDownloadErrors(): void {
    if (!parsed) return;
    const csv = toCsv(['row', 'reason'], parsed.errors.map((e) => [e.row, e.reason]));
    downloadTextFile(`vmi_${group}_errors.csv`, csv);
  }

  function downloadTemplate(): void {
    downloadTextFile(`vmi_${group}_template.csv`, toCsv(TEMPLATES[group], []));
  }

  const acceptedCount = group === 'enrolment' ? (parsed?.enrolmentRows.length ?? 0) : (parsed?.vendorRows.length ?? 0);

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Configuration readiness"
        description="Active auto-reorder EANs and whether they have every rule needed for a clean replenishment run."
      >
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Badge variant="success" size="sm">{readyCount} ready</Badge>
          <Badge variant="warning" size="sm">{readiness.length - readyCount} need attention</Badge>
        </div>

        {readiness.length === 0 ? (
          <EmptyState title="Nothing to check" description="Enrol an active auto-reorder EAN to see its readiness." />
        ) : (
          <DataTable minWidth="620px">
            <DataTableHeader>
              <DataTableHead>EAN</DataTableHead>
              <DataTableHead>Style</DataTableHead>
              <DataTableHead>Missing configuration</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {readiness.map((r) => (
                <DataTableRow key={r.ean}>
                  <DataTableCell className="font-medium text-gray-900">{r.ean}</DataTableCell>
                  <DataTableCell>{r.style}</DataTableCell>
                  <DataTableCell>
                    {r.missing.length === 0 ? (
                      <Badge variant="success" size="sm">Ready</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {r.missing.map((m) => (
                          <Badge key={m} variant="warning" size="sm">{m}</Badge>
                        ))}
                      </div>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title="Bulk upload"
        description="Download a template, fill it in, and upload to validate. Accepted rows can then be imported (appended)."
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="sm:w-56">
            <span className="block text-xs font-medium text-gray-700 mb-1">Configuration group</span>
            <Select value={group} onValueChange={(v) => { setGroup(v as BulkGroup); setParsed(null); }}>
              <SelectTrigger aria-label="Configuration group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrolment">Enrolment</SelectItem>
                <SelectItem value="vendorMoq">Vendor & MOQ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Download template
          </Button>
          <div className="sm:w-64">
            <Input aria-label="Upload CSV" type="file" accept=".csv" onChange={handleFile} />
          </div>
        </div>

        {parsed ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" size="sm">{parsed.accepted} accepted</Badge>
              <Badge variant="error" size="sm">{parsed.rejected} rejected</Badge>
              <Badge variant="warning" size="sm">{parsed.warnings} warnings</Badge>
              <span className="text-xs text-gray-500">of {parsed.total} rows ({GROUP_LABEL[group]})</span>
            </div>
            {parsed.errors.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-xs text-gray-600 list-disc pl-4">
                {parsed.errors.slice(0, 6).map((e) => (
                  <li key={`${e.row}-${e.reason}`}>{e.row > 0 ? `Row ${e.row}: ` : ''}{e.reason}</li>
                ))}
                {parsed.errors.length > 6 ? <li>+{parsed.errors.length - 6} more…</li> : null}
              </ul>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleImport} disabled={acceptedCount === 0}>
                <Upload className="w-3.5 h-3.5 mr-1" />
                Import {acceptedCount} accepted
              </Button>
              {parsed.errors.length > 0 ? (
                <Button size="sm" variant="outline" onClick={handleDownloadErrors}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download errors
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </AdminSectionCard>

      <AdminSectionCard title="Version history" description="Recent configuration changes (this browser).">
        {auditLog.length === 0 ? (
          <EmptyState title="No changes recorded yet" description="Saving or importing on any tab records an entry here." />
        ) : (
          <DataTable minWidth="620px">
            <DataTableHeader>
              <DataTableHead>When</DataTableHead>
              <DataTableHead>Group</DataTableHead>
              <DataTableHead>Action</DataTableHead>
              <DataTableHead>Detail</DataTableHead>
              <DataTableHead>By</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {auditLog.map((a) => (
                <DataTableRow key={a.id}>
                  <DataTableCell className="whitespace-nowrap">{formatDateTime(a.at)}</DataTableCell>
                  <DataTableCell>{a.group}</DataTableCell>
                  <DataTableCell>{a.action}</DataTableCell>
                  <DataTableCell>{a.detail}</DataTableCell>
                  <DataTableCell>{a.by}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Approvals & audit" description="How change control is represented in this prototype.">
        <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
          <li>Every configurable record carries a status (Draft / Submitted / Approved / Active / Inactive) and effective dates.</li>
          <li>Each tab commits via Save; approved values should be superseded by a new version rather than edited in place.</li>
          <li>Overlapping active configurations are blocked at validation on the relevant tabs.</li>
          <li>Last configuration change: {lastModified ? formatDateTime(lastModified) : 'none yet'}.</li>
        </ul>
      </AdminSectionCard>
    </div>
  );
}
