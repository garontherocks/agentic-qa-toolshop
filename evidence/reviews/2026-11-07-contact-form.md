# Review: contact form (TC-01..07, API-01..07/09..12/14, VR-01..03, A11Y-01..05)

Date: 2026-11-07 · Reviewer: test-reviewer · Plan: `specs/contact-form.md`
Scope: the four contact specs, `src/pages/home-page.ts`, `src/data/factories.ts`, `.gitignore`, `specs/findings.md`, `booker-domain` skill.
Method: read the code and ran `npx playwright test --list` only. No tests were executed by the reviewer. The run results reported by the caller are taken as given.

## Verdict: CHANGES REQUESTED (1 blocking, 6 should fix, 7 nits)

Owner-decision compliance:
- 2 valid real submissions: met. TC-01 is chromium only, in its own describe with `retries: 0` as the first statement. API-01 is in its own nested describe with `retries: 0`. Both use `contactMessage()` defaults.
- Every other POST has a missing or blank field: met. `sendGuarded()` asserts this before posting. The API-02/03/04/05/06/07/09/10 payloads were checked one by one. API-11 bypasses the guard, but it is fixme and none of its bodies can be a valid message.
- No mask in visual tests: met.
- VR-02 fixme for MSG-ERR-ORDER: met.
- A11Y-01/03 assert the exact summary with a `finding` annotation: met.
- A11Y-04/05 fixme: met.
- No finding is asserted as correct behaviour: met. API-11/12/14, VR-02 and A11Y-04/05 assert the expected behaviour inside fixme.
- No order assertions on validation messages: met. TC-03 asserts count 8 plus membership.
- No absolute counts of the shared message box: met.
- Plan traceability is complete: every planned expect appears. The deviations are listed below.
- No `waitForTimeout`, `force`, `test.only` or retries-to-hide. All locators in the specs are testid, role or label, except `errorAlert`.

## Blocking

1. `src/pages/home-page.ts:40-46` (also used at `tests/e2e/contact-form.spec.ts:79,214` and `tests/visual/contact-form.spec.ts:37`).
   - Problem: TC-02, TC-07 and VR-03 post a fully valid message and rely only on `mockContactSuccess()` to keep it off the server. Nothing proves the mock was hit.
   - Why it matters: a real 200 and the mocked 200 render the same thank-you page, so every assertion passes either way. If the glob `**/api/message` stops matching (path change, trailing slash, base URL change), each run silently creates real messages on the shared demo. They cannot be deleted, and they would blow the budget of 2 (TC-02 x3 browsers, TC-07 x3, VR-03).
   - Fix: make the mock identifiable and assert it. For example, add a header like `x-mock: contact` to the fulfilled response, or return a hit counter from `mockContactSuccess()`. Then have the three tests assert the response carries the header or the counter is 1 before the thank-you assertions. Alternatively, abort anything that is not the mock: register a catch-all that fails on a POST to `/api/message` that the mock did not fulfil.

## Should fix

1. `tests/api/contact-message.spec.ts:222-231` (API-11).
   - Problem: it uses the raw `request` fixture instead of `BookerClient` (suite-conventions: "API calls go through BookerClient"). It also bypasses `sendGuarded`.
   - Fix: add a raw-body method to `BookerClient` (headers and data passthrough) and use the `api` fixture.
2. `tests/a11y/contact-form.spec.ts:15-16` (A11Y-01).
   - Problem: it waits only for `#contact` to be visible, then runs axe. If the form hydrates after the section, the summary can be `[]` and the exact-summary assertion flakes. A11Y-03 is safe because the click waits for the button.
   - Fix: `await expect(homePage.contact.description).toBeVisible()` (or `submit`) before `scanA11y`.
3. `tests/visual/contact-form.spec.ts:13,31,50` (VR-01/02/03).
   - Problem: the screenshot target is the whole `#contact` section. I could not verify in a browser (read-only review) whether `#contact` also contains admin-editable branding data (address, phone, email of the B&B). If it does, the baseline depends on other people's edits to the shared site, and the owner has banned masks.
   - Fix: confirm in Playwright MCP what `#contact` contains. If it holds branding data, screenshot only the form card, for example `section.locator('.card-body')` exposed through the page object, or ask the owner for a mask exception. Otherwise record "static" in `booker-domain`.
4. `package.json:17` and the `@smoke` tags at `tests/e2e/contact-form.spec.ts:24` and `tests/api/contact-message.spec.ts:55`.
   - Problem: `test:smoke` is `--grep @smoke`, so every smoke run creates 2 real messages (TC-01 and API-01). A smoke run followed by a full run in CI makes 4, against the "exactly 2 per full run" decision. The plan mandates the tag, so this is a policy gap, not a coding error.
   - Fix: owner decision. Either drop `@smoke` from the two real-submission tests, or document that a smoke run counts against the budget. I did not check the CI pipeline (not in scope).
5. `specs/coverage.md:8`.
   - Problem: the "Contact form" row still says "— / — / — / to plan". CLAUDE.md says the manager keeps it current.
   - Fix: set Plan `contact-form.md`, Suites E2E/API/Visual/A11Y, the test count (47 listed, 8 skipped by design or fixme), and Status.
6. `evidence/agent-runs/`.
   - Problem: no log exists for this planner/generator/QA-manager/general-purpose/triager session (rule 6). The page-object and factory changes in particular need an entry recording the owner approvals.
   - Fix: add the log with the `evidence-log` skill before merge.

## Nit

1. `tests/api/contact-message.spec.ts:132,153,174`: `expect('1'.repeat(n)).toHaveLength(n)` can never fail. Delete these three lines.
2. `tests/a11y/contact-form.spec.ts:67-111` vs `tests/api/contact-message.spec.ts:213` and `tests/visual/contact-form.spec.ts:16`.
   - A11Y-04/05 use a runtime `test.fixme(true, reason)` inside the body. The API and visual specs use a declared `test.fixme(title, details, body)`.
   - Both are valid Playwright, and the runtime form matches the `flaky-triage` skill wording. The runtime form is a bit wasteful (the `homePage` and `page` fixtures are set up before the skip), but it keeps the reason in the report. The declared form is static and skips without any fixture setup.
   - Fix: pick one style for the file set. I recommend the declared form with `annotation: [finding, issue]` (as in API/VR), because the body never runs. The reason can stay in the finding annotation.
3. `tests/a11y/contact-form.spec.ts:106-109` (A11Y-05).
   - The plan accepts either a visible `role=alert` in `#contact` or `aria-live` polite/assertive. The test checks only `role=alert`, so a fix using `aria-live` alone would fail the un-fixme'd test.
   - Fix: add the `aria-live` alternative, for example with `expect.poll` or `toHaveAttribute` on the alert or its container.
4. `tests/a11y/contact-form.spec.ts:36-45` (A11Y-02): the testid strings are hard-coded and duplicate the page object. The plan asks for "same element as the field's testid locator".
   - Fix: compare against `control` (for example with `evaluate` identity), or at least drop the duplicated literals.
5. `src/pages/home-page.ts:26`: `errorAlert` is `#contact .alert-danger`, a descendant selector with a Bootstrap class.
   - Verdict: acceptable. The element has no role, testid or id, and its lack of `role=alert` is the confirmed finding A11Y-ALERT-LIVE. It is scoped to `#contact`, has a doc comment, and is one locator in one place. Prefer `this.page.locator('#contact').locator('.alert-danger')`, and add a comment to switch to `getByRole('alert')` when A11Y-ALERT-LIVE is fixed.
6. `src/pages/home-page.ts:37-38`: the doc comment says real submissions "must go through the API", but TC-01 submits through the UI. Reword it to "other than TC-01".
7. `tests/e2e/contact-form.spec.ts:145,182` (and `tests/e2e/contact-form.spec.ts:60-63`).
   - `test.skip(browserName...)` in the body runs after `beforeEach` has loaded the shared site. That is 4 wasted page loads on each of Firefox and WebKit.
   - Fix: move the chromium-only tests into their own describe with a `beforeEach` skip declared before `goto`.
   - Also `tests/e2e/contact-form.spec.ts:53-54`: "form gone" is asserted via field and button counts, not the plan's `#contact form`. This is equivalent for users, so no change is required.
   - `tests/api/contact-message.spec.ts:54`: remove the leftover generator instruction comment.
   - Also minor: the shared `labelFinding` object is reused as an annotation in two tests (`tests/a11y/contact-form.spec.ts:7`).
   - Also minor: the `issue` annotation type holds free text, not a link.

## Specific answers

- `#contact .alert-danger` locator: acceptable (nit 5).
- A11Y-04/05 fixme style: valid and matches the `flaky-triage` skill, but it is inconsistent with the API and visual specs (nit 2). Not blocking.
- Mock correctness: POST-only gating is correct (`route.request().method()`, else `route.continue()`). The glob does not match `/api/message/count` or `/api/message/1`. The mock is registered after the first real 400 in TC-07, as required. The only flaw is that nothing verifies the mock was hit (blocking 1).
- TC-01 real-submission assertions: complete against the plan. It checks the form fields visible, a POST to `/api/message` returning 200, the heading containing the name, the subject, "as soon as possible." and the form gone. `waitForResponse` is registered before the click. The skip comes before any request. There is no content check of the request body, which the plan does not require.
- Typing: `interface` to `type` alias is a correct fix. Interfaces lack an implicit index signature, so they are not assignable to `Record<string, unknown>` (`Payload`). `Pick<SyntheticGuest, ...>` in `booker-client.ts` still works. No other effect.
- `.gitignore` `test-results-cli/`: fine.
- `specs/findings.md`: 6 rows match the plan IDs, each with a test and an evidence reference. The `Evidence` column cites the triager run but not an `evidence/` file path (see should fix 6).
- `booker-domain` additions: consistent with the plan. Nit: it records a third party's seed message (sender name and subject; redacted by the coordinator) in a versioned file. It is a public demo seed, but it is better to say "one seed message".
- Declared fixme tests (API-11/12/14, VR-02) appear as skipped in reports. Rule 9 expects the published replay to show only tests that ran. Check that the replay filters skipped tests with a `finding` annotation.
- Visual baselines: none exist, so VR-01/03 will fail on their first CI run until CI regenerates them on request. This is expected.

---

# Round 2

Date: 2026-11-07 · Reviewer: test-reviewer · Method: re-read the four specs and `src/pages/home-page.ts`; `npx playwright test --list` (47 tests in 4 files, unchanged). No tests executed by the reviewer; the caller's run results are taken as given.

## Verdict: APPROVED (0 blocking; 2 should fix remain by owner decision; 4 new nits)

## Round 1 items

- Blocking 1 (mock never verified): FIXED. `mockContactSuccess()` fulfils with `x-qa-mock: contact-success` (`src/pages/home-page.ts:42-53`). TC-02 (`tests/e2e/contact-form.spec.ts:81-85`), TC-07 (`:222-226`) and VR-03 (`tests/visual/contact-form.spec.ts:48-52`) register `waitForResponse` (POST only) before the click and assert the header. In TC-07 the promise is registered after the first real 400 has been rendered, so it can only match the second POST. Nothing weakened; the thank-you assertions are intact.
- Should fix 2 (A11Y-01 hydration): FIXED (`tests/a11y/contact-form.spec.ts:15-16`).
- Should fix 3 (visual scope): ACCEPTED on the triager evidence (`#contact` = form card only, no branding, byte-identical HTML over 2 contexts). Baselines still need the CI regeneration run.
- Should fix 1 (API-11 uses `request`): OPEN, deferred to the owner (`tests/api/contact-message.spec.ts:219`). Test is fixme and no body can be a valid message, so no data risk.
- Should fix 4 (`@smoke` creates 2 real messages): OPEN, owner decision (`tests/e2e/contact-form.spec.ts:23`, `tests/api/contact-message.spec.ts:55`).
- Should fix 5/6 (coverage.md, evidence log): OPEN until the QA manager does them; required before merge, not a code defect.
- Nit 1 (tautological lengths): FIXED (`tests/api/contact-message.spec.ts:131,151,171`).
- Nit 2 (fixme style): FIXED, A11Y-04/05 use `test.fixme(title, details, body)` like API/VR (`tests/a11y/contact-form.spec.ts:69,87`).
- Nit 3 (A11Y-05 aria-live): FIXED (`tests/a11y/contact-form.spec.ts:104-107`), scoped to `#contact`, filtered by the error text. Compared with the plan (`specs/contact-form.md:51,351`): it also accepts `role=status`, which the plan does not list. Harmless widening for a fixme'd test; see new nit 3.
- Nit 4 (A11Y-02 duplicated testid literals): OPEN, unchanged (`tests/a11y/contact-form.spec.ts:36-39,44`). Optional.
- Nit 5 (errorAlert locator): TODO added; see new nit 1.
- Nit 6 (JSDoc): FIXED (`src/pages/home-page.ts:36-41`).
- Nit 7 (chromium-only skips, generator comment): FIXED. TC-04/TC-06 sit in a nested describe with a describe-level `test.skip(({ browserName }) => ...)` (`tests/e2e/contact-form.spec.ts:150-151`), so `beforeEach` does not run for Firefox/WebKit; TC-05 stays on all browsers. Generator comment replaced (`tests/api/contact-message.spec.ts:54`). Shared annotation object inlined. Counts consistent with the caller's run (chromium 8 = TC-02..07 with TC-04 x3).
- Nothing was weakened: every round-1 assertion is still present.

## Remaining

### Blocking
None.

### Should fix
1. `tests/api/contact-message.spec.ts:219` (API-11): raw `request` instead of a `BookerClient` method. Owner to authorise a raw-body method on `BookerClient`, or record the exception.
2. `@smoke` on TC-01/API-01 (`tests/e2e/contact-form.spec.ts:23`, `tests/api/contact-message.spec.ts:55`): owner decision on whether `test:smoke` may spend the 2-message budget.
3. Before merge: `specs/coverage.md:8` and the `evidence/agent-runs/` log (QA manager).

### Nit
1. `src/pages/home-page.ts:26-28`: the `// TODO` line sits between the JSDoc and `errorAlert`, which can detach the doc comment in some tooling; put the TODO inside the JSDoc. Also `errorAlert:this.page` is missing a space (run the formatter).
2. `tests/e2e/contact-form.spec.ts:150-206`: body of the new nested describe is not indented (formatting only).
3. `tests/a11y/contact-form.spec.ts:105`: `[role="status"]` is not in the plan; either add it to the plan or drop it.
4. Residual risk of the mock: if the glob ever stops matching, the header assertion fails loudly but only after the real POST has already created a message (TC-02/TC-07 x3 browsers, VR-03). Acceptable now (the glob was exercised by the passing runs); a fail-closed alternative is a catch-all route that aborts any POST to `/api/message` not fulfilled by the mock.
5. Carried over: `tests/a11y/contact-form.spec.ts:36-39,44` (nit 4 above); the seed sender name in `booker-domain` is reported to the owner (since removed).
