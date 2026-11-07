# 2026-11-07 · auth · triage (CI E2E, PR #5)

- **Asked**: `/triage-ci ci-artifacts/e2e`. The owner reported 17 failures in CI on all three browsers that retries did not fix, while the same branch was green locally. They asked for diagnosis only.
- **Agents**:
  - coordinator: Claude Code main session
  - `failure-triager`
  - both on model `claude-opus-5-5`
- **Inputs**:
  - `ci-artifacts/e2e/`: `test-results/` with 33 folders, plus `playwright-report/`.
  - The CI run was GitHub Actions in container `mcr.microsoft.com/playwright:v1.64.1-noble`, on merge commit `880f0c8`.
  - Local branch `feat/auth` at `b08a75e`.

## What the agents did
- **Failure-triager:**
  - Extracted all 32 traces into the session scratchpad and analysed network, console and the failing step with node scripts.
  - Decoded the embedded report data.
  - Ran a local comparison of TC-01 and TC-03 on e2e-chromium with `--workers=1 --trace=on`; TC-03 used `customer@` with the correct password, once.
- **Coordinator, independent spot-checks:**
  - 30 of 33 traces contain `cf-mitigated: challenge`.
  - The 3 without it are exactly TC-05 chromium retry1, TC-13 chromium retry1 and the seed.
  - The seed's `POST /users/login` body is `{"message":"Something went wrong"}`.
  - TC-03 chromium: `GET /account` → 403, ray `a569d01adbc18179-DFW`.
- **Constraints:** no browser action waited more than 30 s, and nothing ran into a timeout that needed marking. No failed login against any demo account. Nothing was edited in tests, fixtures, config, the workflow or `ci-artifacts/`.

## Result
**Report totals:** 44 tests: 16 expected, 16 unexpected, 1 flaky (the seed), 11 skipped.

| Test | Project(s) | Class | Evidence |
|---|---|---|---|
| TC-01 | chromium, firefox, webkit (+retry1) | environment | `GET /account/profile` → 403 `cf-mitigated: challenge`, ray `a569cf762fe56c08-DFW` (05:06:44Z). The SPA never boots, so no redirect happens. |
| TC-02 | chromium, firefox, webkit (+retry1) | environment | `GET /account` and `/admin` → 403 challenge (ray `a569cf7cca663177-DFW`) |
| TC-03 | chromium, firefox, webkit (+retry1) | environment | Login 200 (381 ms), then `GET /account` → 307 → 403 challenge (`a569d01adbc18179-DFW`). The failure screenshot is "Verify you are human". |
| TC-04 | chromium, firefox, webkit (+retry1) | environment | `GET /admin/dashboard` → 403 challenge (`a569d04458c4f04e-DFW`) |
| TC-05 | chromium, firefox, webkit (+retry1) | environment | Same 403 challenge. On chromium, teardown and setup were also aborted by the API stall (below). |
| TC-13 | chromium (+retry1) | environment | Attempt 1: register 201, then `/auth/login` → 403 challenge (`a569d12eabaa6707-DFW`). Retry1: `/auth/register` took 80.8 s, admin `POST /users/login` → 500 after 63 s, and the cleanup failed. |
| Seed | chromium | flaky (environment: API 500) | `POST /users/login` → 500 `{"message":"Something went wrong"}` at 05:10:16Z. It passed on retry. |
| TC-10 | firefox | not a failure | The report shows it passed on all 3 browsers, and it has no folder. The owner's report could not be confirmed. |

### Local vs CI
| | Local | CI |
|---|---|---|
| `GET /account` | 200 HTML (cf-ray `…-EZE`) | 307 → 403 challenge (`…-DFW`) |
| JS bundles | 200 | 200 (0 failed, pending or slow) |
| Build | `main-GAD5H2ZL.js`, same `last-modified` | same |
| User agent | same | same |

Local run: `npx playwright test tests/e2e/auth/tc-01-*.spec.ts tests/e2e/auth/tc-03-*.spec.ts --project=e2e-chromium --workers=1 --trace=on` → **2 passed (12.3 s)**.

There is no 429 anywhere. The only 5xx responses are `GET /users/refresh` 500 (known finding REFRESH-500) and the API stall of `POST /users/login` 500 between about 05:08 and 05:10Z.

### Most likely cause
- **Cause:** Cloudflare's managed challenge (Turnstile) on practicesoftwaretesting.com challenges document navigations that come from the GitHub-hosted runner (colo DFW). Playwright cannot solve it, so the Angular app never renders. Retries come from the same IP and fail the same way.
- **Secondary cause:** a transient API degradation on the shared host.
- **Test defects found:** none. Nothing was handed to the healer.

### Recommended changes (not made, awaiting owner decision)
1. **Workflow:** run the auth E2E projects from an egress the site accepts (self-hosted runner, or an allow-list agreed with the site owner), or move them to a non-blocking nightly. Do not try to bypass the challenge.
2. **Fixtures:** detect a challenge page (`cf-mitigated: challenge` or the title "Just a moment…") and fail fast with an "environment: blocked by Cloudflare" message instead of a 45 s timeout.
3. **Cleanup fixtures:** give requests bounded timeouts so an API stall does not push teardown past the test timeout.
4. **Versions:** align Playwright versions. The image is 1.64.1 and the lockfile is 1.65.0.

### Shared database
- The admin search after triage (dry run, nothing deleted) lists **5** `qa-agent+*@example.test` users:
  - `609e024b`, `496967d5`, `9997c9bf`, `df286d80`, `c9d10460`
- `df286d80` is one of the users the triager expected the failed TC-13 run to leave behind.
- The others may come from this CI run or from other runs.
- They were **not deleted**: this session was diagnosis-only, and deleting them needs the owner's approval.

## Human decisions
- Diagnosis only: no edits to tests, fixtures or the workflow.
- 30 s limit per browser action; no failed logins against demo accounts.

## Not verified
- Which Cloudflare rule fires (IP reputation, path or rate), and whether the CI IP is permanently challenged.
- The CI-only 307 (probably Cloudflare's cookie handoff).
- The diff between the CI merge commit `880f0c8` (PR head `5059185`) and `b08a75e`.
- The GitHub Actions log; only the artifacts were read.

## Notes for next time
- Check `cf-mitigated` / `cf-ray` first whenever CI shows "URL changed but nothing rendered": a challenge page looks like a product bug, with no redirect and no content.
- Cleanup fixtures need their own request timeouts on a shared, sometimes slow API.
