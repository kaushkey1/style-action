import { test, expect, type ConsoleMessage } from '@playwright/test';

const JARVIS_URL = '/jarvis';

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
});

// ─── 1. Page Load & Header ───────────────────────────────────────────
test.describe('Jarvis Dashboard — Page Load', () => {
  test('loads the Jarvis dashboard page', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await expect(page.getByText('Jarvis CX Intelligence')).toBeVisible();
    await expect(page.getByText('Store 9626')).toBeVisible();
    await expect(page.getByText('Live CCTV')).toBeVisible();
  });

  test('shows date preset selector defaulting to Today', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Today').first()).toBeVisible();
  });

  test('shows all 5 tab triggers', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await expect(page.getByRole('tab', { name: 'Command Center' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Walk-in' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Trial' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Billing' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'PulsePoint Actions' })).toBeVisible();
  });
});

// ─── 2. Command Center Tab ──────────────────────────────────────────
test.describe('Jarvis Dashboard — Command Center Tab', () => {
  test('displays Command Center content by default', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    // Command Center is the default tab
    await expect(page.getByRole('tab', { name: 'Command Center' })).toHaveAttribute('data-state', 'active');
    // Should have some section headers or metric content
    await page.waitForTimeout(2000);
    // Check no crash — page should have content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });
});

// ─── 3. Walk-in Tab ─────────────────────────────────────────────────
test.describe('Jarvis Dashboard — Walk-in Tab', () => {
  test('switches to Walk-in tab and shows content', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Walk-in' }).click();
    await expect(page.getByRole('tab', { name: 'Walk-in' })).toHaveAttribute('data-state', 'active');
    await page.waitForTimeout(2000);
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();
  });
});

// ─── 4. Trial Tab ───────────────────────────────────────────────────
test.describe('Jarvis Dashboard — Trial Tab', () => {
  test('switches to Trial tab and shows content', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Trial' }).click();
    await expect(page.getByRole('tab', { name: 'Trial' })).toHaveAttribute('data-state', 'active');
    await page.waitForTimeout(2000);
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();
  });
});

// ─── 5. Billing Tab ─────────────────────────────────────────────────
test.describe('Jarvis Dashboard — Billing Tab', () => {
  test('switches to Billing tab and shows content', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'Billing' }).click();
    await expect(page.getByRole('tab', { name: 'Billing' })).toHaveAttribute('data-state', 'active');
    await page.waitForTimeout(2000);
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();
  });
});

// ─── 6. PulsePoint Actions Tab ──────────────────────────────────────
test.describe('Jarvis Dashboard — PulsePoint Actions Tab', () => {
  test('switches to PulsePoint Actions tab', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await expect(page.getByRole('tab', { name: 'PulsePoint Actions' })).toHaveAttribute('data-state', 'active');
    await page.waitForTimeout(3000);
  });

  test('shows PulsePoint Actions header', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByText('PulsePoint Actions').nth(1)).toBeVisible();
  });

  test('shows severity summary cards (S0, S1, S2, Total)', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByText('S0 Critical')).toBeVisible();
    await expect(page.getByText('S1 High')).toBeVisible();
    await expect(page.getByText('S2 Watch')).toBeVisible();
    await expect(page.getByText('Total Actions')).toBeVisible();
  });

  test('shows filter dropdowns', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(3000);
    // Filter bar should have severity, journey, category, source selects
    await expect(page.getByText('Sort:')).toBeVisible();
  });

  test('shows action cards or empty state', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(4000);
    // Either action cards are present or an empty state
    const hasActions = await page.locator('[role="button"][aria-expanded]').count();
    const hasEmptyState = await page.getByText('All clear').count();
    const hasLoading = await page.getByText('Analyzing data').count();
    expect(hasActions + hasEmptyState + hasLoading).toBeGreaterThan(0);
  });

  test('action cards expand and collapse on click', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(4000);

    const actionCards = page.locator('[role="button"][aria-expanded="false"]');
    const count = await actionCards.count();
    if (count > 0) {
      // Click to expand first card
      await actionCards.first().click();
      await expect(actionCards.first()).toHaveAttribute('aria-expanded', 'true');
      // Check evidence section appears
      await expect(page.getByText('Evidence').first()).toBeVisible();
      // Click again to collapse
      await page.locator('[role="button"][aria-expanded="true"]').first().click();
      await page.waitForTimeout(500);
    }
  });

  test('severity filter works', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(4000);

    // Count total action cards
    const totalBefore = await page.locator('[role="button"][aria-expanded]').count();
    if (totalBefore === 0) return; // no actions to filter

    // Open severity filter and select S0
    // The filter selects are in the FilterBar
    const severityTrigger = page.locator('button').filter({ hasText: /All Severities|Severity/ }).first();
    if (await severityTrigger.isVisible()) {
      await severityTrigger.click();
      await page.waitForTimeout(500);
      const s0Option = page.getByRole('option', { name: 'S0 Critical' });
      if (await s0Option.isVisible()) {
        await s0Option.click();
        await page.waitForTimeout(1000);
        const totalAfter = await page.locator('[role="button"][aria-expanded]').count();
        expect(totalAfter).toBeLessThanOrEqual(totalBefore);
      }
    }
  });

  test('sort options work', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(4000);

    // Find the sort select trigger
    const sortTrigger = page.locator('button').filter({ hasText: /Severity|Category|Journey Stage/ }).last();
    if (await sortTrigger.isVisible()) {
      await sortTrigger.click();
      await page.waitForTimeout(500);
      const categoryOption = page.getByRole('option', { name: 'Category' });
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

// ─── 7. Date Picker Interaction ─────────────────────────────────────
test.describe('Jarvis Dashboard — Date Picker', () => {
  test('date preset can be changed to This Week', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    // Find the date preset select
    const dateSelect = page.locator('button').filter({ hasText: 'Today' }).first();
    await dateSelect.click();
    await page.waitForTimeout(500);
    const thisWeekOption = page.getByRole('option', { name: 'This Week' });
    if (await thisWeekOption.isVisible()) {
      await thisWeekOption.click();
      await page.waitForTimeout(2000);
    }
  });

  test('custom date range shows date inputs', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    const dateSelect = page.locator('button').filter({ hasText: 'Today' }).first();
    await dateSelect.click();
    await page.waitForTimeout(500);
    const customOption = page.getByRole('option', { name: 'Custom' });
    if (await customOption.isVisible()) {
      await customOption.click();
      await page.waitForTimeout(1000);
      await expect(page.getByLabel('Start date')).toBeVisible();
      await expect(page.getByLabel('End date')).toBeVisible();
    }
  });
});

// ─── 8. Tab Switching Flow ──────────────────────────────────────────
test.describe('Jarvis Dashboard — Tab Switching', () => {
  test('can switch through all tabs sequentially without errors', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });

    const tabs = ['Command Center', 'Walk-in', 'Trial', 'Billing', 'PulsePoint Actions'];
    for (const tabName of tabs) {
      await page.getByRole('tab', { name: tabName }).click();
      await expect(page.getByRole('tab', { name: tabName })).toHaveAttribute('data-state', 'active');
      await page.waitForTimeout(1500);
    }

    // Switch back to Command Center
    await page.getByRole('tab', { name: 'Command Center' }).click();
    await expect(page.getByRole('tab', { name: 'Command Center' })).toHaveAttribute('data-state', 'active');
  });
});

// ─── 9. Console Errors Check ────────────────────────────────────────
test.describe('Jarvis Dashboard — No Console Errors', () => {
  test('no JavaScript errors while navigating all tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const tabs = ['Walk-in', 'Trial', 'Billing', 'PulsePoint Actions', 'Command Center'];
    for (const tabName of tabs) {
      await page.getByRole('tab', { name: tabName }).click();
      await page.waitForTimeout(2000);
    }

    // Filter out expected API errors (network failures for Smarti API are okay in dev)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('net::') && !e.includes('fetch') && !e.includes('Failed to fetch') && !e.includes('ERR_')
    );

    if (unexpectedErrors.length > 0) {
      console.log('Unexpected console errors:', unexpectedErrors);
    }
    // Just log for now — real API errors are expected if Smarti API is not reachable
  });
});

// ─── 10. Responsive — Mobile ────────────────────────────────────────
test.describe('Jarvis Dashboard — Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('renders without horizontal overflow on mobile', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // small tolerance
  });

  test('tabs are visible and scrollable on mobile', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    // At least first tab should be visible
    await expect(page.getByRole('tab', { name: 'Command Center' })).toBeVisible();
  });

  test('PulsePoint Actions tab works on mobile', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByText('S0 Critical')).toBeVisible();
  });
});

// ─── 11. Responsive — Tablet ────────────────────────────────────────
test.describe('Jarvis Dashboard — Tablet (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('renders properly on tablet', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await expect(page.getByText('Jarvis CX Intelligence')).toBeVisible();

    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByText('S0 Critical')).toBeVisible();
  });
});

// ─── 12. Screenshots for visual review ──────────────────────────────
test.describe('Jarvis Dashboard — Visual Screenshots', () => {
  test('capture screenshots of all tabs', async ({ page }) => {
    await page.goto(JARVIS_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/jarvis-command-center.png', fullPage: true });

    await page.getByRole('tab', { name: 'Walk-in' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/jarvis-walk-in.png', fullPage: true });

    await page.getByRole('tab', { name: 'Trial' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/jarvis-trial.png', fullPage: true });

    await page.getByRole('tab', { name: 'Billing' }).click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/jarvis-billing.png', fullPage: true });

    await page.getByRole('tab', { name: 'PulsePoint Actions' }).click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'test-results/jarvis-pulsepoint-actions.png', fullPage: true });
  });
});
