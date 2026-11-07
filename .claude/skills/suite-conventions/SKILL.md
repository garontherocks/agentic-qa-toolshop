---
name: suite-conventions
description: Conventions for every test in this repo (IDs, structure, locators, assertions, data, tags, per-suite rules for E2E, API, visual and accessibility). Load before writing, generating, healing or reviewing a test.
user-invocable: false
---

# Suite conventions

## IDs, titles and tags
- Every test has a stable ID that also appears in its plan in `specs/`:
  `TC-<nn>` E2E · `API-<nn>` API · `VR-<nn>` visual · `A11Y-<nn>` accessibility.
- Title = `ID: behaviour in plain English`, e.g. `TC-07: a guest books a room for two nights and sees the confirmation`.
- `test.describe` = the area (`Checkout`, `Product search`). Tags: `@smoke` for the critical path, plus the area
  (`@checkout`). Never tag by browser; projects handle that.

## Structure
- Import `test`/`expect` from `src/support/fixtures`, never straight from `@playwright/test` inside `tests/`.
- Page objects live in `src/pages`, extend `BasePage`, expose locators as readonly fields and user intents as
  methods (`addToCart()`, not `clickButton()`). No assertions inside page objects except readiness checks.
- API calls go through `BookerClient` (`api` / `adminApi` fixtures). One concern per test; independent
  tests; no reliance on execution order.

## Locators (in this order)
1. `getByTestId(...)` — the app uses `data-testid` on some elements (configured as the test id attribute); many controls only have an `id`, use `#id` then.
2. `getByRole(name)` / `getByLabel(...)`.
3. Text only for static copy. Never CSS chains, `nth-child`, XPath or generated ids such as `product-01M6…`.

## Assertions
- Web-first: `await expect(locator).toBeVisible()/toHaveText()/toHaveURL()`. No `isVisible()` + `if`.
- Assert the user-visible outcome the plan promises (message, total, URL, state), not intermediate steps.
- Prices and totals: compute the expectation from data you read (API or product page), never hard-code.
- Never `waitForTimeout`, `force: true`, `{ timeout: 0 }`, or loosened regexes to get green.

## Data
- The hosted demo is shared. Use `syntheticGuest()`, `futureStay()` and `contactMessage()` from
  `src/data/factories.ts`; the public admin account from `src/support/env.ts`. No real names, emails or addresses.
- Read-only on shared state: never change branding, never edit or delete rooms, bookings or messages the suite
  did not create. Bookings can't be deleted on the hosted demo, so create one only when the test is about booking.
- Do not depend on other people's bookings and messages, or on the exact rooms and prices: read them from the API.

## Per suite
- **E2E** (`tests/e2e`, Chromium/Firefox/WebKit): user journeys; keep each under ~30 s.
- **API** (`tests/api`, project `api`): status, key fields and error messages per endpoint; auth vs no-auth vs
  wrong role; validation rules discovered from error messages are recorded in `booker-domain`.
- **Visual** (`tests/visual`, Chromium, Linux baselines next to each spec in `__screenshots__/`, regenerated only
  by the CI `update_snapshots` run): stable states only (forms, empty states, error
  states). Mask anything whose data can change (room cards, prices, the map):
  `toHaveScreenshot('VR-03-contact-errors.png', { mask: [homePage.rooms] })`. One screenshot per test, named `<ID>-<state>.png`.
- **Accessibility** (`tests/a11y`): `scanA11y(page)` from `src/support/a11y`; assert no `critical`/`serious`
  violations. When a page has confirmed axe findings, do not `fixme` the test and never exclude rules: assert that
  `summary` (sorted by rule id) equals exactly the known violations, each tagged with its finding ID in a
  `finding` annotation, so a new violation or a fixed one fails the test (decided by the owner, 2026-11-07).
