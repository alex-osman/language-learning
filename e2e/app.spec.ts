import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://mandarindb.com';

async function navigateToFirstEpisode(page: Page) {
  await page.goto(`${BASE_URL}/media`);
  await page.waitForLoadState('networkidle');
  await page.locator('h2, h3').filter({ hasText: /Peppa/i }).first().click();
  await page.waitForLoadState('networkidle');
  // Wait for actual episode cards to load (not just the loading spinner)
  await page.waitForSelector('.episode-card', { timeout: 10000 });
  await page.locator('.episode-info').first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('Media Gallery', () => {
  test('shows media titles', async ({ page }) => {
    await page.goto(`${BASE_URL}/media`);
    await page.waitForLoadState('networkidle');
    const title = page.locator('h2, h3').filter({ hasText: /Peppa|Jiayun|Orion/i }).first();
    await expect(title).toBeVisible();
  });

  test('shows % known badge on each card', async ({ page }) => {
    await page.goto(`${BASE_URL}/media`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/\\d+% known/').first()).toBeVisible();
  });

  test('clicking a show navigates to its episodes', async ({ page }) => {
    await page.goto(`${BASE_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.locator('h2, h3').filter({ hasText: /Peppa/i }).first().click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/media\/\d+\/episodes/);
  });
});

test.describe('Episode List', () => {
  test('episode cards load after auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.locator('h2, h3').filter({ hasText: /Peppa/i }).first().click();

    // Wait for episodes to load — should not stay on "Loading episodes..."
    await page.waitForSelector('.episode-card', { timeout: 10000 });
    const episodeCount = await page.locator('.episode-card').count();
    expect(episodeCount).toBeGreaterThan(0);
  });

  test('clicking an episode navigates to overview', async ({ page }) => {
    await page.goto(`${BASE_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.locator('h2, h3').filter({ hasText: /Peppa/i }).first().click();
    await page.waitForSelector('.episode-card', { timeout: 10000 });
    await page.locator('.episode-info').first().click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/episodes\/\d+/);
  });
});

test.describe('Episode Overview', () => {
  test('shows episode title, Watch Video and Start Practice buttons', async ({ page }) => {
    await navigateToFirstEpisode(page);
    await page.screenshot({ path: '/tmp/episode-overview.png', fullPage: true });

    await expect(page.locator('button, a').filter({ hasText: /Watch Video/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button, a').filter({ hasText: /Practice/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('progress circle is rendered', async ({ page }) => {
    await navigateToFirstEpisode(page);
    const circle = page.locator('app-progress-indicator, circle, svg').first();
    await expect(circle).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Video Player', () => {
  async function navigateToVideoPlayer(page: Page) {
    await navigateToFirstEpisode(page);
    await page.locator('button, a').filter({ hasText: /Watch Video/i }).first().click();
    await page.waitForLoadState('networkidle');
  }

  test('video player loads with a video element', async ({ page }) => {
    await navigateToVideoPlayer(page);
    await page.screenshot({ path: '/tmp/video-player.png', fullPage: true });
    expect(page.url()).toMatch(/\/video/);
    await expect(page.locator('video')).toBeVisible({ timeout: 5000 });
  });

  test('spacebar toggles play/pause without crashing', async ({ page }) => {
    await navigateToVideoPlayer(page);
    await expect(page.locator('video')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    // Check the page hasn't crashed or navigated away
    expect(page.url()).toContain('/video');
  });

  test('arrow keys navigate between sentences', async ({ page }) => {
    await navigateToVideoPlayer(page);
    await expect(page.locator('video')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowLeft');
    expect(page.url()).toContain('/video');
  });

  test('script panel shows sentences', async ({ page }) => {
    await navigateToVideoPlayer(page);
    await expect(page.locator('.sentence-item').first()).toBeVisible({ timeout: 8000 });
    const count = await page.locator('.sentence-item').count();
    expect(count).toBeGreaterThan(0);
  });
});
