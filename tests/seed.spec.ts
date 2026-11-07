import { test, expect } from '../src/support/fixtures';

// Seed test for the Playwright agents. The planner explores from here and the generator copies
// its structure: imports from src/support/fixtures, page objects from src/pages, data-test locators.
// Keep it small, stable and human-written.
test.describe('Seed', () => {
  test('home page lists products and the main navigation @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-home')).toBeVisible();
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();
    await expect(page.getByTestId('product-name').first()).toBeVisible();
  });

  test('a seeded customer can sign in @smoke', async ({ customerPage }) => {
    await expect(customerPage).toHaveURL(/\/account/);
    await expect(customerPage.getByTestId('nav-sign-in')).toBeHidden();
  });
});
