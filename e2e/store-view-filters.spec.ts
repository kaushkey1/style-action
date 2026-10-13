import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

// Reusable auth bypass: mock session API + inject sessionStorage
async function createAuthenticatedPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.route('**/sentinel/service/panel/users/v1.0/session**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          firstName: 'Rakesh', lastName: 'Yadav',
          email: 'rakeshyadav1@gofynd.com', profilePicUrl: null,
          roleSlug: 'business-head', orgName: 'Reliance Retail',
        },
      }),
    });
  });

  await page.goto('https://local.jioimpetus.com:5173/login', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });
  await page.evaluate(() => {
    sessionStorage.setItem('impetus-nav', JSON.stringify({
      state: {
        isAuthenticated: true,
        currentUser: {
          firstName: 'Rakesh', lastName: 'Yadav',
          email: 'rakeshyadav1@gofynd.com', profilePicUrl: null,
          roleSlug: 'business-head', orgName: 'Reliance Retail',
        },
        activeProductId: null,
      },
      version: 0,
    }));
    sessionStorage.removeItem('impetus-logged-out');
  });

  return { browser, context, page };
}

test.describe('Store View — Cascading Filters', () => {
  test('city options update immediately when region is selected (before Apply)', async () => {
    const { browser, page } = await createAuthenticatedPage();

    try {
      await page.goto('https://local.jioimpetus.com:5173/store-view', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await expect(page.getByRole('button', { name: 'Region' }).first()).toBeVisible({ timeout: 30000 });

      // ── Capture City count BEFORE selecting a region ──
      const cityButton = page.getByRole('button', { name: 'City' }).first();
      await cityButton.click();
      await page.waitForTimeout(500);
      const cityDropdown = page.locator('.absolute.z-50');
      await expect(cityDropdown).toBeVisible();
      const cityCountBefore = await cityDropdown.locator('ul li button').count();
      console.log(`City options BEFORE: ${cityCountBefore}`);
      await cityButton.click();
      await page.waitForTimeout(300);

      // ── Select a region (draft change only, NO Apply) ──
      const regionButton = page.getByRole('button', { name: 'Region' }).first();
      await regionButton.click();
      await page.waitForTimeout(500);
      const regionDropdown = page.locator('.absolute.z-50');
      await expect(regionDropdown).toBeVisible();
      const firstRegion = regionDropdown.locator('ul li button').first();
      const selectedRegion = (await firstRegion.textContent())?.trim() ?? '';
      console.log(`Selecting region: "${selectedRegion}" (NOT clicking Apply)`);
      await firstRegion.click();
      await regionButton.click(); // close dropdown

      // Wait for the cascading API calls to complete (no Apply click!)
      await page.waitForTimeout(3000);

      // ── Capture City count AFTER selecting a region ──
      const cityButtonAfter = page.getByRole('button', { name: 'City' }).first();
      await cityButtonAfter.click();
      await page.waitForTimeout(500);
      const cityDropdownAfter = page.locator('.absolute.z-50');
      await expect(cityDropdownAfter).toBeVisible();
      const cityCountAfter = await cityDropdownAfter.locator('ul li button').count();
      console.log(`City options AFTER selecting "${selectedRegion}": ${cityCountAfter}`);

      console.log('\n========================================');
      console.log('  CASCADING FILTER TEST (NO APPLY)');
      console.log('========================================');
      console.log(`Region selected: "${selectedRegion}"`);
      console.log(`Cities: ${cityCountBefore} -> ${cityCountAfter}`);
      console.log(`Changed immediately: ${cityCountBefore !== cityCountAfter}`);
      console.log('========================================\n');

      expect(
        cityCountBefore !== cityCountAfter,
        `BUG: City options did NOT update immediately after selecting region "${selectedRegion}" ` +
        `(without clicking Apply). Count stayed at ${cityCountBefore}. ` +
        `Expected: cities should cascade instantly on draft filter change.`
      ).toBe(true);

      expect(cityCountAfter).toBeLessThan(cityCountBefore);

    } finally {
      await browser.close();
    }
  });
});
