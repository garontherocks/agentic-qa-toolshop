---
name: flaky-triage
description: Checklist to classify and fix flaky or failing Playwright tests (causes, evidence to collect, fixes that are allowed and fixes that are not). Use when triaging, healing or reviewing.
user-invocable: false
---

# Flaky and failing tests

## Collect first
Error message, failing step in the trace (`npx playwright show-trace`), screenshot/video, project/browser,
whether it passes alone, pass ratio over 3 isolated runs, and the plan step it implements.

## Usual causes → allowed fix
- Locator matches 0 or many → use `data-test`/role, scope to a container.
- Asserting before data arrives → web-first assertion on the final state (`toHaveText`, `toHaveCount`).
- Navigation race → `await expect(page).toHaveURL(...)` before the next step.
- Shared data (another user changed it) → own your data via factories/API setup; never read others' state.
- Browser-specific behaviour → fix the page object for all browsers; skip a browser only with a linked reason.
- Real product defect → `test.fixme(true, '<finding id>: <reason>')` and a row in coverage "Product findings".

## Never
Adding `waitForTimeout`, raising timeouts to hide slowness, `force: true`, retries in code, catching and
ignoring assertion errors, or deleting the assertion that fails.
