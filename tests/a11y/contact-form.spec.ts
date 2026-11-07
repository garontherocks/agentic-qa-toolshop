// spec: specs/contact-form.md
// seed: tests/seed.spec.ts

import { test, expect } from '../../src/support/fixtures';
import { scanA11y } from '../../src/support/a11y';

test.describe('Contact form', () => {
  test(
    'A11Y-01: axe scan of #contact reports only the known unlabelled Message textarea',
    { tag: '@contact', annotation: { type: 'finding', description: 'A11Y-MSG-LABEL — specs/findings.md' } },
    async ({ homePage, page }) => {
      // 1. Run scanA11y on #contact in the initial state
      await homePage.goto();
      await expect(homePage.contact.section).toBeVisible();
      await expect(homePage.contact.description).toBeVisible();
      await expect(homePage.contact.submit).toBeVisible();

      const { summary } = await scanA11y(page, { include: '#contact' });
      const sorted = [...summary].sort((a, b) => a.id.localeCompare(b.id));

      // Known finding A11Y-MSG-LABEL: when fixed this test fails and the summary must become empty.
      expect(sorted).toEqual([{ id: 'label', impact: 'critical', nodes: 1 }]);
    },
  );

  test(
    'A11Y-02: labels Name, Email, Phone and Subject resolve to their controls',
    { tag: '@contact' },
    async ({ homePage }) => {
      // 1. Each label resolves to exactly one element, and it is the page object's control for that field
      await homePage.goto();
      const { section, name, email, phone, subject } = homePage.contact;
      await expect(section).toBeVisible();

      const fields = [
        { label: 'Name', control: name },
        { label: 'Email', control: email },
        { label: 'Phone', control: phone },
        { label: 'Subject', control: subject },
      ];
      for (const { label, control } of fields) {
        const byLabel = section.getByLabel(label, { exact: true });
        await expect(byLabel, `label ${label}`).toHaveCount(1);
        await expect(control, `control for ${label}`).toHaveCount(1);
        // Same DOM node: the label's control is the page object's locator.
        const sameNode = await byLabel.evaluate(
          (labelled, target) => labelled === target,
          await control.elementHandle(),
        );
        expect(sameNode, `label ${label} points at the page object's control`).toBe(true);
      }
    },
  );

  test(
    'A11Y-03: axe scan of the error state after an empty submit reports only the known label violation',
    { tag: '@contact', annotation: { type: 'finding', description: 'A11Y-MSG-LABEL — specs/findings.md' } },
    async ({ homePage, page }) => {
      // 1. Click Submit empty, wait for the error alert, then scan #contact
      await homePage.goto();
      await homePage.contact.submit.click();
      await expect(homePage.contact.errorAlert).toBeVisible();

      const { summary } = await scanA11y(page, { include: '#contact' });
      const sorted = [...summary].sort((a, b) => a.id.localeCompare(b.id));

      // Known finding A11Y-MSG-LABEL: when fixed this test fails and the summary must become empty.
      expect(sorted).toEqual([{ id: 'label', impact: 'critical', nodes: 1 }]);
    },
  );

  // Finding A11Y-MSG-LABEL: label for="message" but the textarea has id="description", so getByLabel finds 0
  // (failure-triager 2026-11-07, 2/2). See specs/findings.md.
  test.fixme(
    'A11Y-04: label Message is associated with the textarea',
    {
      tag: '@contact',
      annotation: { type: 'finding', description: 'A11Y-MSG-LABEL — specs/findings.md' },
    },
    async ({ homePage }) => {
      // 1. getByLabel('Message') resolves to the page object's description textarea
      await homePage.goto();
      const byLabel = homePage.contact.section.getByLabel('Message', { exact: true });
      await expect(byLabel).toHaveCount(1);
      const sameNode = await byLabel.evaluate(
        (labelled, target) => labelled === target,
        await homePage.contact.description.elementHandle(),
      );
      expect(sameNode).toBe(true);
    },
  );

  // Finding A11Y-ALERT-LIVE: the .alert-danger and its ancestors up to #contact have no role, aria-live or
  // aria-atomic (failure-triager 2026-11-07, 2/2). See specs/findings.md.
  test.fixme(
    'A11Y-05: the contact error alert is announced to screen readers',
    {
      tag: '@contact',
      annotation: {
        type: 'finding',
        description: 'A11Y-ALERT-LIVE — specs/findings.md (failure-triager 2026-11-07, 2/2)',
      },
    },
    async ({ homePage }) => {
      // 1. Click Submit empty and wait for the error alert
      await homePage.goto();
      await homePage.contact.submit.click();
      await expect(homePage.contact.errorAlert).toBeVisible();

      // 2. The error is announced: role="alert" (assertive) and role="status" (polite) are both live
      // regions that screen readers announce, as is an explicit aria-live, so any of them satisfies the
      // requirement (owner decision 2026-11-07). Scoped to #contact: page-wide getByRole('alert') matches
      // an unrelated element.
      const announcer = homePage.contact.section.locator(
        ':is([role="alert"], [role="status"], [aria-live="polite"], [aria-live="assertive"])',
      );
      await expect(announcer.filter({ hasText: 'Name may not be blank' })).not.toHaveCount(0);
    },
  );
});
