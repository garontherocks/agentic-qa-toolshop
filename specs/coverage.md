# Coverage

Maintained by the `qa-manager` agent at the end of every loop. Status: planned → generated → green → reviewed.

| Area | Plan | Suites | Cases | Status |
|---|---|---|---|---|
| Seed (smoke) | — (human-written) | E2E | 2 | green |
| Auth – round 1 (P1) | [auth.md](auth.md) | E2E, API, A11Y, VR | 34 generated (14 TC, 15 API, 2 A11Y, 3 VR), of which 4 are `fixme` for product findings (TC-17, TC-18, TC-19, API-17); A11Y-01/02 assert the exact known axe violations | reviewed (approved, `evidence/reviews/2026-11-07-auth-round1-r2.md`) and green: e2e-chromium + api + a11y 27 passed, 4 skipped (fixme), 0 failed on 2026-11-07; all browsers before the a11y change 45 passed, 14 skipped, 0 failed. VR-01..03 written but not run; Linux baselines pending from CI. Earlier TC-03 red was the shared `customer@` account being locked (423, environment), cleared by the re-run. |
| Auth – round 2 (pending) | [auth.md](auth.md) | E2E, API, A11Y, VR | 8 (TC-11, TC-15, TC-16, API-13, API-14, A11Y-03, A11Y-04, VR-04) | planned |

**Auth round 1, generated IDs** (projects):
- E2E (e2e-chromium, e2e-firefox, e2e-webkit): TC-01, TC-02, TC-03, TC-04, TC-05, TC-07, TC-08, TC-09, TC-10, TC-12, TC-17 (fixme).
- E2E (e2e-chromium only): TC-13 (the only UI registration), TC-18 (fixme), TC-19 (fixme).
- API (api): API-01 … API-12, API-15, API-16, API-17 (fixme).
- A11Y (a11y): A11Y-01, A11Y-02 (exact known violations).
- Visual (visual, Linux baselines regenerated in CI; not run locally): VR-01, VR-02, VR-03.
- Not generated: TC-06 (triager did not reproduce the reload loop, 0/4). Dropped: TC-14 (covered by API-11).

**Last run** 2026-11-07, `npx playwright test tests/e2e/auth tests/api/auth tests/a11y/auth --project=e2e-chromium --project=e2e-firefox --project=e2e-webkit --project=api --project=a11y` (61 s): 42 passed, 3 failed, 14 skipped. Per project (passed/failed/skipped): e2e-chromium 10/1/3, e2e-firefox 9/1/4, e2e-webkit 9/1/4, api 14/0/1, a11y 0/0/2. The 3 failures are TC-03 on each browser: `customer@practicesoftwaretesting.com` login → 423 "Account locked, too many failed attempts" (failure-triager: environment; admin and customer2 log in fine; no suite code path sends a wrong password to a demo account). API-10 isolated: 3/3 passed (`--repeat-each=3 --workers=1`). Visual: not run locally (Linux baselines, regenerated in CI on request).

## Product findings

Confirmed product defects found by the suite. Each one is a `test.fixme()` in the code with the same ID.

| Finding | Test | Behaviour | Evidence | Found |
|---|---|---|---|---|
| ADMIN-BLANK | TC-17 | Anonymous visitors and customers opening `/admin` stay on `/admin` with an empty page (no redirect, no message); `/account` redirects to `/auth/login`. No data leaks (only `GET /users/me`). Redirect vs message is an owner decision. | failure-triager 2026-11-07, 4/4 (anon ×2, customer ×2); `specs/auth.md` Product findings | 2026-11-07 |
| REFRESH-500 | API-17 | `GET /users/refresh` without a token or with an invalid bearer → 500 `{"message":"Server Error"}` instead of 401. (POST → 405, not routed.) The UI reload loop seen in logs was NOT reproduced (0/4). | failure-triager 2026-11-07, 2/2 | 2026-11-07 |
| CHPW-JSERR | TC-18 | On `/account/profile`, input in `new-password-confirm` logs `ERROR TypeError: Cannot read properties of undefined (reading 'value')`; the password change itself still works. | failure-triager 2026-11-07, 2/2 (synthetic users) | 2026-11-07 |
| PWD-MIN | TC-19 | Registration UI error says "Password must be minimal 6 characters long." while the hint and the API enforce 8 (7 → 422, 8 → 201). | failure-triager 2026-11-07, 2/2 (UI and API) | 2026-11-07 |
| A11Y-PWD-TOGGLE | A11Y-01, A11Y-02 | axe `button-name` (critical): the show-password toggle `<button class="btn btn-outline-secondary">` has no accessible name (login, register). | two identical a11y runs 2026-11-07 | 2026-11-07 |
| A11Y-LANG-LABEL | A11Y-01, A11Y-02 | axe `label-content-name-mismatch` (serious): `language-select` has aria-label "Select language" but visible text "EN" (global nav). | two identical a11y runs 2026-11-07 | 2026-11-07 |
| A11Y-RULES-LIST | A11Y-02 | axe `list` (serious): the password-rules `<ul>` directly contains another `<ul>` (register). | two identical a11y runs 2026-11-07 | 2026-11-07 |
