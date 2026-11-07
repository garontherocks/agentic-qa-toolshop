# 2026-11-07 · contact-form · loop

- **Asked**: coordinator (main session) → `qa-manager`: "Run steps 1 and 2 of your workflow for the area contact-form
  (front page contact form, UI section `#contact`, and API `POST /api/message`) and then STOP", with 7 written rules
  (30 s per browser action, zero valid submissions while exploring, at most one valid submission per test, generous
  negative cases, synthetic data, candidate findings not filed, no failed logins). After the plan the coordinator relayed
  the owner's approval with 9 changes and asked for steps 3–7, stopping before any commit.
- **Agents**: coordinator (main session); `qa-manager` (Claude Opus 5.5) delegating to `playwright-test-planner` ×3,
  `failure-triager` ×2, `playwright-test-generator` ×4 (one per suite), `playwright-test-healer` ×1, `test-reviewer` ×2,
  `general-purpose` ×3 (page object, booker-domain + findings, booker-domain correction).
- **Seed / inputs**: `tests/seed.spec.ts` (untouched), `specs/coverage.md` (Contact form "to plan"), `booker-domain`
  skill as updated by the coordinator, `src/pages/home-page.ts`, `src/api/booker-client.ts`, `src/data/factories.ts`.

## Before the loop (coordinator, main session)
- Browser verification of the contact form through Playwright MCP: 5 checks, **0 real submissions**; the success state
  was seen only with a mocked `POST /api/message`. One `POST /api/auth/validate` → 403 while opening the admin
  Messages page was **not reproduced** (1 of 2 tries) and is not a finding. The `/reservation/{id}` page was **not
  verified** (empty body after 30 s). Facts recorded in `booker-domain`.

## What the agents did
1. **Coverage (qa-manager)**: there was no contact-form coverage except the seed's check that `ContactName` is visible.
   The gaps, riskiest first, were: anonymous message reads (data exposure), API validation, the happy path, UI
   error/success states, a11y (unlabelled Message), and visual states.
2. **Plan v1 (planner)**: `specs/contact-form.md`, 29 cases. The planner made 0 valid submissions and saw success only
   through a mock. It did not report an exact count of its invalid POSTs ("a handful"). It found a new candidate,
   CF-4: malformed or non-JSON bodies return 500.
3. **qa-manager check of v1** found these problems, sent back to the planner (v2):
   - The plan claimed "no retries", but `playwright.config.ts` has `retries: CI ? 1 : 0`. The data-creating tests now
     use `retries: 0` in their own describe.
   - API-01 was inconsistent: it claimed to cover a 1-char name but the example name was "Q Test".
   - The whitespace-only name case had no guard.
   - Assorted text mistakes and ambiguities.
4. **Plan shown to the owner via the coordinator** with 2 valid submissions per full run: TC-01 on e2e-chromium only,
   plus API-01. The owner approved it with changes (see Human decisions).
5. **Reproduction (failure-triager)**, 22:37:57–22:38:22 UTC, fresh contexts, 22 real POSTs (all invalid), 0 valid.
   - CF-1 to CF-5 reproduced 2/2.
   - CF-6 reproduced 2/2: the alert has no role or aria-live.
   - Error order (CF-7): 6 different orders in 6 runs (3 UI, 3 API).
   - TC-07: the old alert is cleared after a successful (mocked) submit. A second empty submit replaces the alert;
     it does not duplicate it.
   - Filed as MSG-ANON-READ (CF-1+2), MSG-ID-500, MSG-BADBODY-500, A11Y-MSG-LABEL, A11Y-ALERT-LIVE and MSG-ERR-ORDER
     in `specs/findings.md` (written by a general-purpose agent).
6. **Page object (general-purpose agent, delegated by the qa-manager, owner-authorised)**: `src/pages/home-page.ts`
   gained `contact.errorAlert`, `contact.successHeading` and `mockContactSuccess()`. The healer later added the
   `x-qa-mock` header (step 10).
7. **Plan v3 (planner)**: applied the owner's decisions and the triage results. Removed API-08 and API-13, moved TC-08
   to round 2, added A11Y-05, and switched A11Y-01/03 to assert the exact axe summary.
   - `booker-domain` was updated with all new verified facts (general-purpose agent).
   - A later correction fixed an inaccurate "3/3 per run, 2 runs" phrase and added the generator's and triager's facts.
8. **Generation (4 generators, one suite each)**:
   - E2E: 5 real POSTs, all invalid.
   - A11Y: page load and read-only DOM only.
   - API and Visual: no browser.
   - None of them could run `npm run typecheck` (no shell). The qa-manager ran it and found TS2345 in the API spec:
     `ContactMessage` is an `interface` and is not assignable to `Record<string, unknown>`.
9. **Runs and an environment incident (qa-manager)** — what went wrong:
   - The first run was piped through `| tail`, which hid all progress. The owner stopped it after more than 7 minutes.
   - The qa-manager relaunched to a log file. That attempt ended with exit 127 and no output.
   - It then killed processes it took for orphans of its first run. PID 18816 and its Chrome/ffmpeg were in fact a
     worker of the `playwright-test` MCP server (the server spawned a new one at 19:57:44). Killing it was a mistake;
     no harm was observed.
   - The owner's exact command (`--reporter=line --timeout=30000 --global-timeout=240000 --max-failures=3`) also
     failed with "Timed out waiting 240s for the clear output to run".
   - Root cause: the MCP server's worker records video into `test-results/.playwright-artifacts-*`, and Windows keeps
     the file locked, so the CLI cannot empty `test-results/`. No test was hanging.
   - Fix: CLI runs use their own output folder. The owner chose `--output=test-results-cli` (added to `.gitignore`).
   - All earlier runs used `--grep-invert "TC-01|API-01"`, so none of them created data.
10. **Review round 1 (test-reviewer)**: CHANGES REQUESTED, with 1 blocking, 6 should fix and 7 nits.
    - Blocking: nothing proved the mock was hit in TC-02, TC-07 and VR-03, which post a fully valid form.
    - The healer fixed it: the mock answers with `x-qa-mock: contact-success` and the three tests assert that header.
    - The healer also fixed the A11Y-01 readiness wait, moved A11Y-04/05 to declared `test.fixme`, and made A11Y-05
      accept role alert/status or aria-live.
    - TC-04/06 now skip at describe level, so Firefox and WebKit don't load the site for nothing.
    - Tautological length checks and a leftover generator comment were removed.
    - The visual-scope question was answered by the failure-triager (23:06 UTC, 2 contexts, read-only): `#contact`
      holds only the form, with no branding values. No change was needed.
11. **Review round 2 (test-reviewer)**: APPROVED, no blocking findings.

## Result
| Item | Count | Where |
|---|---|---|
| Plan sections | 4 suites + round 2 (TC-08) | `specs/contact-form.md` |
| Tests generated | 29: E2E 9, API 12, Visual 3, A11Y 5 | `tests/e2e/contact-form.spec.ts`, `tests/api/contact-message.spec.ts`, `tests/visual/contact-form.spec.ts`, `tests/a11y/contact-form.spec.ts` |
| Tests healed | 0 failures to heal; 6 tests changed after review (TC-02, TC-07, VR-03, A11Y-01, A11Y-04, A11Y-05) plus structural edits to TC-04/06 and API-05/06/07 | working tree (not committed) |
| Marked `fixme` (product findings) | 6: API-11, API-12, API-14, VR-02, A11Y-04, A11Y-05; A11Y-01/03 assert the known axe violation with a `finding` annotation | `specs/findings.md` |
| Review verdict | round 1 CHANGES REQUESTED, round 2 APPROVED | `evidence/reviews/2026-11-07-contact-form.md` |
| Real valid messages created on the shared demo | **2** in the whole session (final run: TC-01 e2e-chromium, API-01) | — |

Runs (all `--output=test-results-cli`; `npm run typecheck` clean before each):
- After the review fixes, `npx playwright test tests/e2e/contact-form.spec.ts --project=e2e-chromium --grep-invert "TC-01|API-01" --reporter=line --timeout=30000 --global-timeout=240000 --max-failures=3` → `8 passed (3.8s)`.
- `npx playwright test <e2e, api, a11y specs> --project=e2e-firefox --project=e2e-webkit --project=api --project=a11y --grep-invert "TC-01|API-01" --reporter=line ...` → `13 skipped, 19 passed (11.9s)`.
- Final, the only run including TC-01 and API-01: `npx playwright test tests/e2e/contact-form.spec.ts tests/api/contact-message.spec.ts tests/a11y/contact-form.spec.ts --project=e2e-chromium --project=e2e-firefox --project=e2e-webkit --project=api --project=a11y --reporter=line --timeout=30000 --global-timeout=240000 --max-failures=5 --output=test-results-cli` → `15 skipped, 29 passed (16.2s)`. The 15 skipped are the 6 fixme tests run where they apply, plus the Chromium-only TC-01, TC-04 ×3 and TC-06 on Firefox and WebKit.
- Visual: `--list` only (3 tests). Baselines are left to the CI `update_snapshots` run, as required. VR-01 and VR-03 will fail until then.

## Human decisions
- **Owner approval (relayed by the coordinator, not received directly by the qa-manager)**:
  - 2 real submissions per full run, both from `contactMessage()`, with retries 0.
  - Valid minima are covered with the blank-field guard.
  - Reproduce CF-1..CF-5 twice before filing.
  - A11Y-01/03 use option A. A11Y-04 is kept as a targeted fixme (qa-manager's call).
  - Remove API-08, merge API-13 into API-12, move TC-08 to round 2.
  - VR-02 has no mask: run it 3 times; it was unstable, so it is fixme MSG-ERR-ORDER.
  - TC-07 asserts the alert is cleared.
  - Add A11Y-05.
  - Page-object additions are authorised.
- **Owner, directly, mid-session**:
  - Stopped the piped run and banned `| tail`/`| grep` on runs.
  - Asked to change `ContactMessage` and `SyntheticGuest` from `interface` to `type` instead of casting in the test
    (done by the qa-manager in `src/data/factories.ts`).
  - Diagnosed the `test-results/` lock and set `--output=test-results-cli` plus the `.gitignore` entry.
- **Rejected / not done**:
  - No commit (as asked).
  - API-11 still uses the raw `request` fixture: a `BookerClient` raw-body method is outside the authorised scope.
  - `@smoke` was first kept on TC-01 and API-01 per the plan; removed after the owner's decision (below).

## Notes for next time
- Never pipe Playwright runs; use `--reporter=line`.
- On Windows, always run the CLI with `--output=test-results-cli` while the `playwright-test` MCP server is up.
- Never kill a Playwright worker without checking its parent process first.
- Generators and the healer have no shell: the qa-manager must run `npm run typecheck` right after generation.
- Open nits from review round 2: all closed before the commit (see "Owner decisions before the commit").

## Owner decisions before the commit (applied by the coordinator, main session)
- `interface` → `type` in `src/data/factories.ts`: confirmed by the owner (asked for it when stopping the first hung run).
- `@smoke` removed from TC-01 and API-01: only the seed carries `@smoke`, so `npm run test:smoke` creates no messages.
  `npx playwright test --list --grep @smoke` → 2 tests, both in `tests/seed.spec.ts`. Plan headings updated.
- API-11 keeps the raw Playwright `request` fixture: accepted.
- Review nits fixed:
  - `src/pages/home-page.ts`: the TODO moved inside the `errorAlert` JSDoc; missing space fixed.
  - `tests/e2e/contact-form.spec.ts`: the "chromium only" describe body indented (formatting only).
  - A11Y-02 and A11Y-04 compare the label's control with the page-object locator (same DOM node) instead of
    hard-coded testids.
  - `mockContactSuccess` is fail-closed: it routes every URL whose path starts with `/api/message`, so no POST to
    the message API can reach the server while the mock is on. The `x-qa-mock` header assertions stay.
  - A11Y-05 accepts `role="alert"` or `role="status"` (and explicit `aria-live`): all are announced live regions;
    documented in the test.
- `booker-domain`: the demo seed message's sender name removed by the coordinator (reviewer nit).
- Re-run after these changes, without real submissions (TC-01 and API-01 already ran in the final run):
  - `npm run typecheck` → clean.
  - `npx playwright test tests/e2e/contact-form.spec.ts tests/api/contact-message.spec.ts tests/a11y/contact-form.spec.ts --project=e2e-chromium --project=e2e-firefox --project=e2e-webkit --project=api --project=a11y --grep-invert "TC-01|API-01" --reporter=line --output=test-results-cli --global-timeout=240000`
    → `13 skipped, 27 passed (15.4s)`.
  - Visual: `--list` → 3 tests; baselines from CI.
- Real messages created in the whole session: still 2 (TC-01 and API-01 in the final run).
- Commit on `feat/contact-form`, pushed for a PR, as approved by the owner.
