import { expect, test } from '@playwright/test';

test('desktop one-page is readable and has no public form', async ({ page }) => {
  const started = Date.now();
  await page.goto('/');
  expect(Date.now() - started).toBeLessThan(3_000);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sprzedaj auto');
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Trzy kroki/ })).toBeVisible();
});

test('mobile viewport exposes the sticky contact CTA', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const sticky = page.getByLabel('Przejdź do sekcji kontaktowej');
  await expect(sticky).toBeVisible();
  await sticky.click();
  await expect(page.locator('#kontakt')).toBeInViewport();
});

test('essential content works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3001/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#faq details')).toHaveCount(5);
  await context.close();
});
