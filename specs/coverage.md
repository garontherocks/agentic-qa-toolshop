# Coverage

One row per area of the Restful-booker platform. The `qa-manager` agent keeps this table current.

| Area | Plan | Suites | Tests | Status |
|---|---|---|---|---|
| Seed (front page, admin login form) | — (human-written) | E2E | 2 | green |
| Contact form (UI `#contact`, `POST /api/message`, anonymous message reads) | [contact-form.md](contact-form.md) | E2E (Chromium, Firefox, WebKit) · API · Visual · A11Y | 29: E2E 9 (TC-01–TC-07; TC-01, TC-04, TC-06 Chromium only) · API 12 (API-01–07, 09–12, 14; 3 fixme) · Visual 3 (VR-01–03; 1 fixme) · A11Y 5 (A11Y-01–05; 2 fixme) | green 2026-11-07 on e2e ×3, api, a11y (29 passed, 15 skipped); visual baselines pending the CI `update_snapshots` run. Round 2: TC-08 (special characters in the thank-you, mocked). 6 product findings in [findings.md](findings.md). Creates 2 real messages per full run (TC-01, API-01, retries 0) |
| Booking (availability, reservation) | — | — | — | to plan |
| Admin sign-in and session | — | — | — | to plan |
| Admin: rooms, bookings and messages (read-only on shared data) | — | — | — | to plan |

Archived: Toolshop auth round 1 (34 tests) in [archive/toolshop-auth.md](archive/toolshop-auth.md), retired when the
suite moved to the Restful-booker platform (Toolshop blocks CI runners with a Cloudflare challenge).
