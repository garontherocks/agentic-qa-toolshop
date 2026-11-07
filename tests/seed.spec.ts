import { test, expect } from '../src/support/fixtures';

// Seed test for the Playwright agents. The planner explores from here and the generator copies its structure:
// imports from src/support/fixtures, page objects from src/pages, role and data-testid locators.
// Keep it small, stable and human-written.
test.describe('Seed', () => {
  test('front page shows the B&B, its rooms and the contact form @smoke', async ({ homePage, api }) => {
    const rooms = await api.rooms();
    await homePage.goto();
    await expect(homePage.rooms.getByRole('heading', { level: 2 })).toHaveText('Our Rooms');
    await expect(homePage.rooms.getByText('Book now', { exact: true })).toHaveCount(rooms.length);
    await expect(homePage.contact.name).toBeVisible();
  });

  test('admin page asks for credentials @smoke', async ({ page, adminLoginPage }) => {
    await adminLoginPage.goto();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(adminLoginPage.submit).toBeEnabled();
  });
});
