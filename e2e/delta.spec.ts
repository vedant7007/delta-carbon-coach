import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * End-to-end happy path in demo mode with AI fully disabled (AI_DISABLED=1).
 * Proves the core promise: the app is 100% usable with the AI off, and the
 * natural-language box degrades gracefully to manual entry.
 */
test('demo sign-in → log manually → see footprint, with AI degradation', async ({ page }) => {
  await page.goto('/login');

  // Demo mode surfaces a no-account entry point.
  const demoButton = page.getByRole('button', { name: /explore the demo/i });
  await expect(demoButton).toBeVisible();
  await demoButton.click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: /your footprint/i })).toBeVisible();

  // Go to logging and try the AI quick-type — it must degrade, not block.
  await page.getByRole('navigation').getByRole('link', { name: 'Log', exact: true }).click();
  await expect(page).toHaveURL(/\/log/);

  await page.getByLabel(/describe your day/i).fill('drove 30km and had a steak');
  await page.getByRole('button', { name: /quick-type/i }).click();

  // Degradation toast appears; user is never blocked.
  await expect(page.getByText(/add it manually/i).first()).toBeVisible();

  // Manual entry still works end to end (default category is Transport).
  await page.getByRole('button', { name: /\+ Petrol car/i }).first().click();
  await expect(page.getByText(/Logged Petrol car/i)).toBeVisible();

  // Footprint reflects the logged activity.
  await page.getByRole('navigation').getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByText(/kg CO₂e/i).first()).toBeVisible();
});

test('dashboard has no automatically-detectable accessibility violations', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /explore the demo/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('methodology page is reachable and cites sources', async ({ page }) => {
  await page.goto('/methodology');
  await expect(page.getByRole('heading', { name: 'Methodology', level: 1 })).toBeVisible();
  // Every factor links to a source.
  await expect(page.getByRole('link', { name: /DEFRA|Our World in Data|CEA/i }).first()).toBeVisible();
});
