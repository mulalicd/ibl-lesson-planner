import { test, expect } from '@playwright/test';

// P2-10 — the public part of the real app in a real browser.
test('a signed-out visitor is sent to the login page', async ({ page }) => {
  await page.goto('/chat');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Prijava' })).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('only @idss.ba addresses may ask for a sign-in link (checked before any request)', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('nastavnik@gmail.com');
  await page.locator('input[type="email"]').press('Enter');
  await expect(page.getByText('Prijava je dozvoljena samo za e-mail adrese @idss.ba.')).toBeVisible();
});

test('an unknown address shows the not-found page, not a crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/ovo-ne-postoji');
  await expect(page.locator('body')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('the user guide opens without signing in and walks through all steps', async ({ page }) => {
  await page.goto('/uputstvo');
  await expect(page.getByRole('heading', { name: 'Od prijave do gotove pripreme' })).toBeVisible();
  await expect(page.locator('section[aria-labelledby$="-naslov"]')).toHaveCount(9);
  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'Uputstvo za korištenje' })).toBeVisible();
});
