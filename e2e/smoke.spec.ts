import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('Dashboard loads at /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeVisible();
    // Verify sidebar rendered with navigation links
    await expect(page.locator('aside')).toBeVisible();
  });

  test('Sidebar navigation to /exceptions', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/exceptions"]');
    await expect(page).toHaveURL('/exceptions');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('Sidebar navigation to /approvals', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/approvals"]');
    await expect(page).toHaveURL('/approvals');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('Sidebar navigation to /agents', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL('/agents');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('Style Bank lazy-loads at /showroom', async ({ page }) => {
    await page.goto('/showroom');
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Style Bank' })).toBeVisible();
  });

  test('/otb loads', async ({ page }) => {
    await page.goto('/otb');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('/range loads', async ({ page }) => {
    await page.goto('/range');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('/aop loads', async ({ page }) => {
    await page.goto('/aop');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('Persona switcher navigates to admin and back', async ({ page }) => {
    await page.goto('/');
    await page.click('button[aria-label="Admin Console"]');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('main#main-content')).toBeVisible();
    await page.click('button[aria-label="Back to App"]');
    await expect(page).toHaveURL('/');
  });
});
