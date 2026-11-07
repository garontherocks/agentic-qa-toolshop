// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { scanA11y } from '../../../src/support/a11y';

// The login page has known product defects (specs/coverage.md "Product findings"). The test pins the exact set of
// axe violations: a new violation, or a known one disappearing (fixed), fails the test so the baseline is updated.
const KNOWN = [
  { id: 'button-name', impact: 'critical', nodes: 1 }, // A11Y-PWD-TOGGLE
  { id: 'label-content-name-mismatch', impact: 'serious', nodes: 1 }, // A11Y-LANG-LABEL
];

const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

test.describe('Auth accessibility', () => {
  test(
    'A11Y-01: the login page has exactly the known axe violations [A11Y-PWD-TOGGLE] [A11Y-LANG-LABEL] @auth',
    {
      annotation: [
        { type: 'finding', description: 'A11Y-PWD-TOGGLE: axe button-name (critical), show-password toggle has no accessible name' },
        { type: 'finding', description: 'A11Y-LANG-LABEL: axe label-content-name-mismatch (serious), language-select "Select language" vs "EN"' },
      ],
    },
    async ({ page, loginPage }) => {
      // 2. Open /auth/login and scan
      await loginPage.goto();
      const initial = await scanA11y(page);
      expect(initial.summary.sort(byId), 'axe violations, default state').toEqual(KNOWN);

      // Submit the empty form to show the errors and scan again
      await loginPage.submit.click();
      await expect(page.getByText('Email is required', { exact: true })).toBeVisible();
      await expect(page.getByText('Password is required', { exact: true })).toBeVisible();
      const withErrors = await scanA11y(page);
      expect(withErrors.summary.sort(byId), 'axe violations, error state').toEqual(KNOWN);
    },
  );
});
