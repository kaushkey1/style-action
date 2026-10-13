import { expect, test, type Page } from '@playwright/test';
import { adminChannels, channelTemplate, planningConfiguration, rule, site } from '../src/test/modules/admin/aopFixtures';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL, baseURL: process.env.AOP_TEST_BASE_URL ?? 'https://local.jioimpetus.com:5173' });

// Render the real page with intercepted data; no login or shared database writes.
async function openGrid(page: Page, siteCount = 40): Promise<void> {
  page.on('pageerror', (error) => { throw error; });
  const configuration = planningConfiguration();
  configuration.parameter_rules = configuration.season_definitions.map((season) => rule({ season_code: season.season_code }));
  const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  await page.route('**/sales-plan/admin/config', (route) => route.fulfill({ json: { data: { configuration, can_write: true, channels: adminChannels, channel_defaults_template: channelTemplate } } }));
  await page.route('**/sales-plan/admin/parameters?**', (route) => route.fulfill({ json: { data: {
    config_id: configuration.config_id, total: siteCount, months, channels: [{ channel_code: 'EBO', total: siteCount }],
    items: Array.from({ length: siteCount }, (_, index) => ({ ...site, site_reference: `master:S${index + 1}`, site_id: `S${index + 1}`, code: `S${index + 1}`, name: `Store ${index + 1}`, months: months.map((month_number) => ({ month_number, applicable: true })) })),
  } } }));
  await page.route('**/__aop-admin-test', (route) => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
  </script><script type="module" src="/e2e/fixtures/aop-admin.tsx"></script></body></html>` }));
  await page.goto('/__aop-admin-test');
  await page.getByRole('button', { name: 'EBO monthly site parameters', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'S1 April NSM%', exact: true })).toBeVisible();
}

test('parameter switching renders only nearby site rows and retains offscreen edits and scroll', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGrid(page, 91);
  const grid = page.getByRole('region', { name: 'EBO monthly values', exact: true });
  await page.getByRole('textbox', { name: 'S1 April NSM%', exact: true }).fill('95');
  const filters = page.getByRole('group', { name: 'EBO parameters', exact: true });
  await filters.getByRole('button', { name: 'Sell-through %', exact: true }).click();
  await filters.getByRole('button', { name: 'Discount %', exact: true }).click();
  const timing = await filters.getByRole('button', { name: 'AOP Achievement %', exact: true }).evaluate((button) => new Promise<{ elapsedMs: number; skeletonObserved: boolean }>((resolve) => {
    const region = document.querySelector('[role="region"][aria-label="EBO monthly values"]')!;
    let skeletonObserved = false;
    const observer = new MutationObserver(() => { skeletonObserved ||= !!region.querySelector('tbody [data-slot="skeleton"]'); });
    observer.observe(region, { childList: true, subtree: true });
    const start = performance.now();
    (button as HTMLButtonElement).click();
    function settled(): void {
      if (region.getAttribute('aria-busy') === 'true') { requestAnimationFrame(settled); return; }
      observer.disconnect();
      resolve({ elapsedMs: performance.now() - start, skeletonObserved });
    }
    requestAnimationFrame(() => requestAnimationFrame(settled));
  }));
  expect(timing.skeletonObserved).toBe(true);
  await expect(grid).toHaveAttribute('aria-busy', 'false');
  const rendered = await grid.getByRole('textbox').count();
  await testInfo.attach('parameter-switch', { body: JSON.stringify({ ...timing, renderedInputs: rendered, totalCells: 91 * 48 }), contentType: 'application/json' });
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(1200);
  const scrollSkeleton = await grid.evaluate((element) => new Promise<boolean>((resolve) => {
    let seen = false;
    const observer = new MutationObserver(() => { seen ||= !!element.querySelector('tbody [data-slot="skeleton"]'); });
    observer.observe(element, { childList: true, subtree: true });
    element.scrollTop = element.scrollHeight;
    element.scrollLeft = element.scrollWidth;
    function settled(): void {
      if (element.getAttribute('aria-busy') === 'true') { requestAnimationFrame(settled); return; }
      observer.disconnect();
      resolve(seen);
    }
    requestAnimationFrame(() => requestAnimationFrame(settled));
  }));
  expect(scrollSkeleton).toBe(true);
  const last = page.getByRole('textbox', { name: 'S91 March AOP Achievement%', exact: true });
  await expect(last).toBeVisible();
  await last.fill('125');
  await filters.getByRole('button', { name: 'Discount %', exact: true }).click();
  expect(await grid.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(last).toHaveValue('125');
  await grid.evaluate((element) => { element.scrollTop = 0; element.scrollLeft = 0; });
  const first = page.getByRole('textbox', { name: 'S1 April NSM%', exact: true });
  await expect(first).toHaveValue('95');
  await first.focus();
  for (let row = 2; row <= 25; row++) {
    await page.keyboard.press('Enter');
    await expect(page.getByRole('textbox', { name: `S${row} April NSM%`, exact: true })).toBeFocused();
  }
  await page.keyboard.press('Shift+Enter');
  await expect(page.getByRole('textbox', { name: 'S24 April NSM%', exact: true })).toBeFocused();
});

test('site search stays in place while entering, changing and clearing a query', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await openGrid(page);
    await expect(page.getByRole('group', { name: 'EBO months', exact: true })).toHaveCount(0);
    const table = page.getByRole('table', { name: 'EBO monthly values', exact: true });
    await expect(table.getByRole('columnheader')).toHaveCount(13);
    await expect(table.getByText('NSM%', { exact: true })).toHaveCount(0);
    const search = page.getByRole('searchbox', { name: 'Search EBO sites', exact: true });
    await search.scrollIntoViewIfNeeded();
    const box = (): Promise<{ x: number; y: number; width: number; height: number }> => search.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height };
    });
    const before = await box();
    for (const query of ['S', 'Store 1', 'No matching site', '']) {
      await search.fill(query);
      await expect.poll(box, { message: `Search moved at ${width}px with query "${query}"` }).toEqual(before);
      await expect(search).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('channel, month and site resets show an in-place skeleton refresh without API requests', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGrid(page);
  const apiRequests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/sales-plan/admin/')) apiRequests.push(request.url()); });
  const grid = page.getByRole('region', { name: 'EBO monthly values', exact: true });
  const input = page.getByRole('textbox', { name: 'S1 April NSM%', exact: true });
  for (const scope of ['channel', 'month', 'site']) {
    await input.fill('95');
    if (scope !== 'channel') await page.getByRole('button', { name: scope === 'month' ? 'EBO April NSM% fill options' : 'Store 1 (S1) fill options', exact: true }).click();
    const button = page.getByRole('button', { name: scope === 'channel' ? 'Reset EBO to default' : 'Reset to default', exact: true });
    const skeletonObserved = await button.evaluate((element) => new Promise<boolean>((resolve) => {
      const region = document.querySelector('[role="region"][aria-label="EBO monthly values"]')!;
      let seen = false;
      const observer = new MutationObserver(() => { seen ||= !!region.querySelector('tbody [data-slot="skeleton"]'); });
      observer.observe(region, { childList: true, subtree: true });
      (element as HTMLButtonElement).click();
      function settled(): void {
        if (region.getAttribute('aria-busy') === 'true') { requestAnimationFrame(settled); return; }
        observer.disconnect();
        resolve(seen);
      }
      requestAnimationFrame(() => requestAnimationFrame(settled));
    }));
    expect(skeletonObserved, `${scope} reset did not refresh the table`).toBe(true);
    await expect(input).toHaveValue('80');
    await expect(grid).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  expect(apiRequests).toEqual([]);
});

test('fill controls fade in and opening the menu keeps its anchor position stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openGrid(page);
  const trigger = page.getByRole('button', { name: 'Store 1 (S1) fill options', exact: true });
  await page.mouse.move(0, 0);
  await expect(trigger).toHaveCSS('opacity', '0');
  await trigger.hover();
  const halfwayOpacity = await trigger.evaluate((element) => {
    const transition = element.getAnimations().find((animation) => animation instanceof CSSTransition && animation.transitionProperty === 'opacity');
    if (!transition?.effect) return null;
    const duration = transition.effect.getComputedTiming().duration;
    if (typeof duration !== 'number') return null;
    transition.pause();
    transition.currentTime = duration / 2;
    const opacity = Number(getComputedStyle(element).opacity);
    transition.finish();
    return opacity;
  });
  expect(halfwayOpacity).not.toBeNull();
  expect(halfwayOpacity!).toBeGreaterThan(0);
  expect(halfwayOpacity!).toBeLessThan(1);
  // Sample the actual opening frames, including placement updates during animation.
  const frames = await trigger.evaluate((element) => new Promise<Array<{ top: string; left: string; opacity: number; transform: string }>>((resolve) => {
    (element as HTMLButtonElement).click();
    const samples: Array<{ top: string; left: string; opacity: number; transform: string }> = [];
    function sample(): void {
      const panel = document.querySelector('[role="dialog"]');
      if (panel) {
        const style = getComputedStyle(panel);
        samples.push({ top: style.top, left: style.left, opacity: Number(style.opacity), transform: style.transform });
      }
      if (samples.length < 20) requestAnimationFrame(sample); else resolve(samples);
    }
    requestAnimationFrame(sample);
  }));
  expect(new Set(frames.map((frame) => `${frame.top}:${frame.left}`)).size, JSON.stringify(frames)).toBe(1);
  expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(true);
  expect(frames.some((frame) => frame.transform !== 'none' && frame.transform !== 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
  const dialog = page.getByRole('dialog', { name: 'Store 1 (S1)', exact: true });
  await expect(dialog).toHaveCSS('opacity', '1');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  await expect(dialog).toHaveCSS('animation-name', 'none');
  await expect(dialog).toHaveCSS('opacity', '1');
});

test('full-sheet paste applies only the selected parameters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGrid(page);
  const parameters = page.getByRole('group', { name: 'EBO parameters', exact: true });
  await parameters.getByRole('button', { name: 'Discount %', exact: true }).click();
  const table = page.getByRole('table', { name: 'EBO monthly values', exact: true });
  await expect(table.getByText('NSM%', { exact: true })).toHaveCount(12);
  await expect(table.getByText('Discount%', { exact: true })).toHaveCount(12);
  const names = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const text = [['Site', 'Site code', ...names.flatMap((month) => ['NSM', 'Sell-through', 'Discount', 'AOP Achievement'].map((parameter) => `${month} · ${parameter} %`))].join('\t'),
    ...[1, 2].map((id) => [`Store ${id}`, `S${id}`, ...names.flatMap(() => ['90', '65', '25', '150'])].join('\t'))].join('\n');
  await page.getByRole('textbox', { name: 'S1 April NSM%', exact: true }).evaluate((element, clipboardText) => {
    const data = new DataTransfer();
    data.setData('text/plain', clipboardText);
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  }, text);
  await expect(page.getByText('2 sites · 12 months · 48 cells', { exact: true })).toBeVisible();
  await expect(page.getByText('48 cells from unselected parameters skipped.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apply to draft', exact: true }).click();
  await expect(page.getByText('48 pending changes across tabs', { exact: true })).toBeVisible();
  await parameters.getByRole('button', { name: 'Sell-through %', exact: true }).click();
  await parameters.getByRole('button', { name: 'AOP Achievement %', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'S1 April NSM%', exact: true })).toHaveValue('90');
  await expect(page.getByRole('textbox', { name: 'S1 April Discount%', exact: true })).toHaveValue('25');
  await expect(page.getByRole('textbox', { name: 'S1 April Sell-through%', exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'S1 April AOP Achievement%', exact: true })).toHaveValue('100');
  await page.getByRole('button', { name: 'Clear EBO filters', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search EBO sites', exact: true }).fill('no matching site');
  await page.getByRole('button', { name: 'Reset EBO to default', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Clear EBO filters', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'S1 April NSM%', exact: true })).toHaveValue('80');
  await expect(page.getByRole('textbox', { name: 'S2 April NSM%', exact: true })).toHaveValue('80');
  await parameters.getByRole('button', { name: 'Discount %', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'S2 March Discount%', exact: true })).toHaveValue('20');
});

for (const width of [375, 1440]) {
  test(`context menus fit the viewport and apply undoable drafts at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openGrid(page);
    const grid = page.getByRole('region', { name: 'EBO monthly values', exact: true });
    const trigger = page.getByRole('button', { name: 'EBO March NSM% fill options', exact: true });
    await grid.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'EBO March NSM%', exact: true });
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
    await dialog.getByLabel('Value (%)', { exact: true }).fill('90');
    await expect(dialog.getByText('40 cells will change.', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`fill-${width}.png`) });
    await dialog.getByRole('button', { name: 'Apply to draft', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const march = page.getByRole('textbox', { name: 'S1 March NSM%', exact: true });
    await expect(march).toHaveValue('90');
    await grid.focus();
    await page.keyboard.press('Control+z');
    await expect(march).toHaveValue('80');
    await page.keyboard.press('Control+Shift+z');
    await expect(march).toHaveValue('90');
    await trigger.click();
    await expect(dialog.getByRole('button', { name: 'Copy month', exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('group', { name: 'Fill action', exact: true })).toHaveCount(0);
    await dialog.getByLabel('Value (%)', { exact: true }).fill('80');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('40 cells will change.', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(march).toHaveValue('90');
    await grid.evaluate((element) => { element.scrollLeft = 0; });
    await page.getByRole('button', { name: 'Store 1 (S1) fill options', exact: true }).click();
    const siteDialog = page.getByRole('dialog', { name: 'Store 1 (S1)', exact: true });
    await siteDialog.screenshot({ path: testInfo.outputPath(`site-fill-${width}.png`) });
    await expect(siteDialog.getByRole('button', { name: 'Copy site pattern', exact: true })).toHaveCount(0);
    await expect(siteDialog.getByRole('group', { name: 'Fill action', exact: true })).toHaveCount(0);
    await siteDialog.getByLabel('Value (%)', { exact: true }).fill('80');
    await expect(siteDialog.getByText('1 cell will change.', { exact: true })).toBeVisible();
    await siteDialog.getByRole('button', { name: 'Reset to default', exact: true }).click();
    await expect(siteDialog).toHaveCount(0);
    await expect(march).toHaveValue('80');
    await expect(page.getByRole('textbox', { name: 'S2 March NSM%', exact: true })).toHaveValue('90');
    await grid.focus();
    await page.keyboard.press('Control+z');
    await expect(march).toHaveValue('90');
    await grid.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await trigger.click();
    await dialog.getByRole('button', { name: 'Reset to default', exact: true }).click();
    await expect(march).toHaveValue('80');
    await expect(page.getByRole('textbox', { name: 'S2 March NSM%', exact: true })).toHaveValue('80');
    await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
