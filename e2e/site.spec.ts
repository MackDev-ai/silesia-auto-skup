import { expect, test } from '@playwright/test';

async function chooseNecessaryCookies(page: import('@playwright/test').Page) {
  const button = page.getByRole('button', { name: 'Tylko niezbędne' });
  try {
    await button.waitFor({ state: 'visible', timeout: 2_000 });
    await button.click();
  } catch {
    // A previous test in the same browser context may have saved the choice.
  }
}

test('desktop one-page is readable and has no public form', async ({ page }) => {
  const started = Date.now();
  await page.goto('/');
  await chooseNecessaryCookies(page);
  expect(Date.now() - started).toBeLessThan(3_000);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sprzedaj auto');
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Trzy kroki/ })).toBeVisible();
});

test('mobile viewport exposes the sticky contact CTA', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  await chooseNecessaryCookies(page);
  const sticky = page.getByLabel('Przejdź do sekcji kontaktowej');
  await expect(sticky).toHaveCount(0);
  await page.locator('#pojazdy').scrollIntoViewIfNeeded();
  await expect(sticky).toBeVisible();
  await sticky.click();
  await expect(page.locator('#kontakt')).toBeInViewport();
});

test('mobile layout has no clipped hero or contact content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');

  for (const viewport of [
    { width: 320, height: 700 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await chooseNecessaryCookies(page);

    const pageWidths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(pageWidths.scroll).toBeLessThanOrEqual(pageWidths.client + 1);

    for (const selector of ['h1', '#kontakt > div']) {
      const widths = await page.locator(selector).evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
      }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
    }

    await page.locator('#pojazdy').scrollIntoViewIfNeeded();
    const stickyBox = await page
      .getByLabel('Przejdź do sekcji kontaktowej')
      .boundingBox();
    expect(stickyBox).not.toBeNull();
    expect(stickyBox!.x).toBeGreaterThanOrEqual(0);
    expect(stickyBox!.x + stickyBox!.width).toBeLessThanOrEqual(
      viewport.width + 1,
    );
  }
});

test('essential content works with JavaScript disabled', async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: testInfo.project.use.baseURL as string,
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#faq details')).toHaveCount(5);
  await context.close();
});

test('cookie choice is remembered and settings can be reopened', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Twoja prywatność i cookies' })).toBeVisible();
  await page.getByRole('button', { name: 'Tylko niezbędne' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Twoja prywatność i cookies' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ustawienia cookies' }).click();
  await expect(page.getByRole('dialog', { name: 'Wybierz zakres zgody' })).toBeVisible();
  await page.getByRole('button', { name: 'Odrzuć opcjonalne' }).click();
});
