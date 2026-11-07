// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { scanA11y } from '../../../src/support/a11y';

// The registration page has known product defects (specs/coverage.md "Product findings"). The test pins the exact
// set of axe violations: a new violation, or a known one disappearing (fixed), fails the test so the baseline is updated.
const KNOWN = [
  { id: 'button-name', impact: 'critical', nodes: 1 }, // A11Y-PWD-TOGGLE
  { id: 'label-content-name-mismatch', impact: 'serious', nodes: 1 }, // A11Y-LANG-LABEL
  { id: 'list', impact: 'serious', nodes: 1 }, // A11Y-RULES-LIST
];

const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

test.describe('Auth accessibility', () => {
  test(
    'A11Y-02: the registration page has exactly the known axe violations [A11Y-PWD-TOGGLE] [A11Y-LANG-LABEL] [A11Y-RULES-LIST] @auth',
    {
      annotation: [
        { type: 'finding', description: 'A11Y-PWD-TOGGLE: axe button-name (critical), show-password toggle has no accessible name' },
        { type: 'finding', description: 'A11Y-LANG-LABEL: axe label-content-name-mismatch (serious), language-select "Select language" vs "EN"' },
        { type: 'finding', description: 'A11Y-RULES-LIST: axe list (serious), password-rules <ul> nested directly in a <ul>' },
      ],
    },
    async ({ page, registerPage }) => {
      // 2. Open /auth/register and scan (nothing submitted)
      await registerPage.goto();
      const { summary } = await scanA11y(page);
      expect(summary.sort(byId), 'axe violations').toEqual(KNOWN);
    },
  );
});
