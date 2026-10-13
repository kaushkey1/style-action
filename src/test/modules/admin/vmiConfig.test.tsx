import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { toCsv, periodsOverlap, isExpired, downloadTextFile } from '@/lib/utils';
import { useVmiConfigStore } from '@/modules/admin/stores/useVmiConfigStore';
import { AdminVmiConfigPage } from '@/modules/admin/pages/AdminVmiConfigPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/vmi-config']}>
      <AdminVmiConfigPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useVmiConfigStore.getState().resetAll();
});

// ─── Pure logic used across the VMI tabs ──────────────────────────────────────

describe('VMI utils', () => {
  it('toCsv escapes commas, quotes and newlines', () => {
    const csv = toCsv(['a', 'b'], [['x,y', 'he said "hi"'], [1, 'plain']]);
    expect(csv).toBe('a,b\n"x,y","he said ""hi"""\n1,plain');
  });

  it('periodsOverlap treats empty dates as open-ended', () => {
    expect(periodsOverlap('2026-01-01', '2026-06-30', '2026-06-01', '2026-12-31')).toBe(true); // overlap
    expect(periodsOverlap('2026-01-01', '2026-03-31', '2026-04-01', '2026-06-30')).toBe(false); // gap
    expect(periodsOverlap('', '', '2026-04-01', '2026-06-30')).toBe(true); // open range covers all
    expect(periodsOverlap('2026-01-01', '', '2025-01-01', '2025-12-31')).toBe(false); // open end starts later
  });

  it('isExpired flags past effective-to only', () => {
    expect(isExpired('2026-01-01', '2026-02-20')).toBe(true);
    expect(isExpired('2026-12-31', '2026-02-20')).toBe(false);
    expect(isExpired('', '2026-02-20')).toBe(false); // open-ended never expires
  });

  it('downloadTextFile runs without throwing (jsdom)', () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:test';
    URL.revokeObjectURL = () => undefined;
    expect(() => downloadTextFile('t.csv', 'a,b\n1,2')).not.toThrow();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
});

// ─── Store: seed, mutations, audit, reset ─────────────────────────────────────

describe('useVmiConfigStore', () => {
  it('seeds baseline defaults', () => {
    const s = useVmiConfigStore.getState();
    expect(s.salesWindow.windowDays).toBe(30);
    expect(s.leadTimes.dcToStore).toBe(4);
    expect(s.leadTimes.vendorToDc).toBe(7);
    expect(s.leadTimes.dcToDc).toBeNull();
    expect(s.dcPo.defaultTrigger).toBe(15);
    expect(s.dcPo.defaultMaxCover).toBe(28);
    expect(s.interDc.enabled).toBe(false);
    expect(s.enrolment.length).toBeGreaterThan(0);
    expect(s.vendorMoq.length).toBeGreaterThan(0);
  });

  it('setEnrolment stamps lastModified and recordAudit prepends', () => {
    const { setEnrolment, recordAudit } = useVmiConfigStore.getState();
    const rows = useVmiConfigStore.getState().enrolment.slice(0, 1);
    setEnrolment(rows);
    expect(useVmiConfigStore.getState().lastModified).not.toBeNull();
    recordAudit('Enrolment', 'Saved', '1 variant');
    const log = useVmiConfigStore.getState().auditLog;
    expect(log[0]?.group).toBe('Enrolment');
    expect(log[0]?.action).toBe('Saved');
  });

  it('resetAll restores seed, clears audit + lastModified', () => {
    const { setSalesWindow, recordAudit, resetAll } = useVmiConfigStore.getState();
    setSalesWindow({ windowDays: 99, applicability: 'global', effectiveFrom: '', effectiveTo: '' });
    recordAudit('Sales Window', 'Saved', 'x');
    resetAll();
    const s = useVmiConfigStore.getState();
    expect(s.salesWindow.windowDays).toBe(30);
    expect(s.auditLog).toHaveLength(0);
    expect(s.lastModified).toBeNull();
  });
});

// ─── UI: page renders, all tabs present, validation + tab switching work ───────

describe('AdminVmiConfigPage', () => {
  it('renders the header and all ten configuration tabs', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /VMI Configuration/i })).toBeInTheDocument();
    for (const name of [
      /Enrolment/, /Sales Window/, /Store \/ STO/, /DC \/ PO/, /Vendor & MOQ/,
      /Lead Times/, /In-Transit/, /Inter-DC Shift/, /Defaults & Overrides/, /Approvals & Audit/,
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument();
    }
  });

  it('shows seeded enrolment data on the default tab', () => {
    renderPage();
    expect(screen.getByDisplayValue('8901234500017')).toBeInTheDocument();
    // Style ID appears on multiple seed variants → assert at least one.
    expect(screen.getAllByDisplayValue('TCO26CMSCNP125363').length).toBeGreaterThan(0);
  });

  it('flags a new empty-EAN enrolment row and keeps Save disabled', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Add EAN/i }));
    expect(await screen.findByText(/EAN is required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeDisabled();
  });

  it('switches to the Approvals tab and computes readiness + shows version history', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /Approvals & Audit/i }));
    expect(await screen.findByText(/Configuration readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/Version history/i)).toBeInTheDocument();
    // Seed has active auto-reorder EANs → at least one readiness row rendered.
    const readyBadges = screen.getAllByText(/ready|need attention/i);
    expect(readyBadges.length).toBeGreaterThan(0);
  });

  it('switches to Lead Times and shows the DC→DC not-set Inter-DC warning', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: /Lead Times/i }));
    expect(await screen.findByText(/Inter-DC transfer delivery dates cannot be generated/i)).toBeInTheDocument();
  });
});
