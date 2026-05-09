import { chromium } from '@playwright/test';

const BASE_URL = 'https://mandarindb.com';

export default async function globalSetup() {
  const email = process.env['TEST_EMAIL'];
  if (!email) {
    console.warn('TEST_EMAIL not set — skipping auth setup. Authenticated tests will fail.');
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${BASE_URL}/media`, { timeout: 10000 }).catch(() => {});

  // Save storage state (JWT in localStorage) for all tests to reuse
  await page.context().storageState({ path: 'e2e/.auth-state.json' });
  await browser.close();
}
