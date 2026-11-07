# Contact form test plan (Restful-booker platform)

## Application Overview

## Status
Approved by the owner 2026-11-07 with changes (relayed by the coordinator). Round 1: TC-01..TC-07, API-01..07, API-09..12, API-14, VR-01..03, A11Y-01..05. Round 2: TC-08. Removed: API-08 (owner), API-13 (merged into API-12). IDs are stable (no renumbering).

## Application Overview
Front-page contact form (`#contact`, h3 "Send Us a Message") of the Shady Meadows B&B on https://automationintesting.online, plus public API `POST /api/message`, and the anonymous read endpoints `GET /api/message`, `GET /api/message/count`, `GET /api/message/1`. The button is `type="button"` and there is no client-side validation: every click posts JSON `{name,email,phone,subject,description}`. 400 renders one `div.alert.alert-danger` with one `<p>` per message; 200 replaces the form with "Thanks for getting in touch {name}!".

## Scope and seed
Seed: `tests/seed.spec.ts` (not edited). In scope: UI form states (empty, error, success), API validation, API happy path, the confirmed anonymous-read and error-handling findings, a11y and visual states of `#contact`. Out of scope: admin message list (opening it marks messages read), PUT/DELETE, branding, load. Facts come from `.claude/skills/booker-domain/SKILL.md` plus the "Verified facts" below (probe and triage 2026-11-07).

## Page object (owner-approved, already written)
- `homePage.contact.errorAlert` = `#contact .alert-danger`.
- `homePage.contact.successHeading` = h3 inside `#contact`, name `/^Thanks for getting in touch /`.
- `homePage.mockContactSuccess()` = mocks POST `**/api/message` with 200 `{"success":true}`; other methods continue to the network.
Every mocked case (TC-02, TC-07, VR-03, TC-08) uses `mockContactSuccess()`; cases assert through the two locators above. No case calls `page.route` for this directly.

## Data and cleanup
Synthetic data only: `contactMessage()` / `syntheticGuest()` from `src/data/factories.ts`, `@example.test` emails. Messages cannot be deleted on the shared site, so there is no cleanup: valid submissions are budgeted. Never assert absolute message counts or ordering of API messages (assert membership, e.g. `expect(body).toContain(...)` / `not.toContain`). The factory's recognisable name ("Qa... Agent...") and subject ("Automated suite check") identify the suite's messages.

### Valid-submission budget (per full run of all projects)
| Case | Projects | Submissions per run | Total |
|---|---|---|---|
| TC-01 UI happy path (real) | e2e-chromium only: `test.skip(browserName !== 'chromium', 'creates a real message; once per run')` | 1 | 1 |
| API-01 API happy path (real) | api (once) | 1 | 1 |
| Every other case | any | 0 | 0 |
| **Total** | | | **2** |

All other UI success checks (TC-02, TC-07, VR-03, and TC-08 in round 2) use `homePage.mockContactSuccess()` and create nothing.

Retries: `playwright.config.ts` has `retries: CI ? 1 : 0`, so CI retries are active. TC-01 and API-01 are the only data-creating cases and each must be generated inside its OWN `test.describe` block containing only that test, with `test.describe.configure({ retries: 0 })` as the first statement of the block (describe-level setting; chosen over a `test.info()`-level equivalent because `test.info().retry` can only observe, not disable, a retry). TC-01 sits in its own describe in `tests/e2e/contact-form.spec.ts`; API-01 in its own describe in `tests/api/contact-message.spec.ts`. CI therefore never resubmits. Worst case with CI retries: 2 (retries 0 on both).

## Boundary strategy
Rules (verified): name only "may not be blank" (no upper bound found up to 1000 chars); email well-formed; phone 11-21; subject 5-100; message 20-2000.
1. API-01 is a plain valid submission built from `contactMessage()` defaults (identifiable name and subject). Phone may optionally be overridden with an 11-char synthetic value `07700900` + 3 digits (Ofcom drama range). It does NOT test any boundary and has no minimum-length subject or description.
2. BOTH valid minima (phone 11, subject 5, description 20) and valid maxima (phone 21, subject 100, description 2000) are covered with the guard technique in API-05, API-06 and API-07: the request carries the field at the boundary plus a deliberately invalid other field (blank name, always rejected); the test expects 400, 'Name may not be blank', and asserts that the field's own size message is ABSENT. Out-of-range values (phone 10/22, subject 4/101, description 19/2001) are invalid by themselves but also keep the blank-name guard.
3. Rule: every API validation case must contain at least one definitely invalid field before running. No fully valid payload outside TC-01 and API-01.
4. The name's 1-char and long (101/1000) edges were covered by API-08, removed by the owner; they remain documented only as verified facts (see below), with no case.

## Product findings (confirmed 2026-11-07, failure-triager 2/2)
Reproduction run: 2026-11-07 22:37:57-22:38:22 UTC, fresh contexts, invalid requests only, 0 valid submissions; each finding reproduced 2/2. Each is generated as `test.fixme()` (except A11Y-MSG-LABEL, see below) with the finding ID in the reason, and must be listed in `specs/findings.md` (ID, evidence, test); the published run shows only tests that ran. IDs below are the ones to use in tests and findings.md.

| Finding ID | Was | Expected | Observed (2/2) | Evidence | Test |
|---|---|---|---|---|---|
| MSG-ANON-READ | CF-1 + CF-2 | Anonymous `GET /api/message` and `GET /api/message/count` return 401 | `GET /api/message` -> 200 application/json with senders' names and subjects; `GET /api/message/count` -> 200 `{"count":n}` | triage run 2026-11-07 22:37:57-22:38:22 UTC, 2 of 2 | API-12 (one `test.fixme()` covering list and count) |
| MSG-ID-500 | CF-3 | Anonymous `GET /api/message/1` returns 401 | 500, no content-type, body "Internal Server Error" | same run, 2 of 2 | API-14 `test.fixme()` |
| MSG-BADBODY-500 | CF-4 | 4xx (400 or 415) | `POST /api/message` with text/plain `name=&email=`, with application/json `{"name":`, and with application/json and no body -> 500 application/json `{"error":"Failed to create message"}` (2/2 each) | same run | API-11 `test.fixme()` |
| A11Y-MSG-LABEL | CF-5 | Label "Message" is associated with the textarea; axe reports no `label` violation | Label `for="message"`, textarea `id="description"`, no element with id `message`; `getByLabel('Message')` count 0. axe through the suite config (tags wcag2a, wcag2aa, wcag21a, wcag21aa, include `#contact`): summary `[{ id: 'label', impact: 'critical', nodes: 1 }]` in the initial state AND after an empty submit (2/2 each) | same run | A11Y-01 and A11Y-03 (option A, NOT fixme: assert the exact summary, with annotation `{ type: 'finding', description: 'A11Y-MSG-LABEL' }`) plus A11Y-04 (targeted `test.fixme()`) |
| A11Y-ALERT-LIVE | CF-6 (new) | After an empty submit the error alert is announced: `#contact` contains a visible `role=alert`, or the alert/its container has aria-live polite/assertive | `#contact .alert-danger` and all its ancestors up to `#contact` have no role, no aria-live, no aria-atomic (2/2) | same run | A11Y-05 `test.fixme()` |
| MSG-ERR-ORDER | CF-7 | Deterministic order of validation messages, so the error state is visually stable | The 8 messages come back in a different order on each request: 3 UI empty submits gave 3 different orders, 3 API all-blank POSTs gave 3 different orders; the SET of 8 is always the same | same run | VR-02 `test.fixme()` (owner decision: NO mask anywhere); TC-03 stays green by asserting membership of the 8 strings plus count 8 |

Decision of the QA manager on A11Y-MSG-LABEL: A11Y-04 stays as the targeted label-association `test.fixme()` because it names the exact defect and turns into a pass the moment the label is fixed; A11Y-01 and A11Y-03 will FAIL at that moment and must then be updated (summary becomes empty).
Observation, not a finding: whitespace-only name `" "` is rejected as blank; unknown extra JSON fields are ignored (400 still driven by real fields).

## Verified facts
Probe 2026-11-07 ~22:30 UTC (headless Chromium, `page.request` / `page.evaluate`, invalid-only requests and a mocked 200) and failure-triager run 2026-11-07 22:37:57-22:38:22 UTC.
| Fact | How | When |
|---|---|---|
| Name rule: only "Name may not be blank"; name of 1, 101 and 1000 chars raised no name message (checked paired with a blank phone). Whitespace-only `" "` gives "Name may not be blank". | 4 invalid POSTs | 2026-11-07 |
| Exact 400 strings: "Name may not be blank", "Name must be set", "Email may not be blank", "Email must be set", "must be a well-formed email address", "Phone may not be blank", "Phone must be set", "Phone must be between 11 and 21 characters.", "Subject may not be blank", "Subject must be set", "Subject must be between 5 and 100 characters.", "Message may not be blank", "Message must be set", "Message must be between 20 and 2000 characters." | invalid POSTs | 2026-11-07 |
| `{}` body gives 10 messages (the "must be set" variants appear for missing keys; blank strings give only "may not be blank" plus size message where applicable). `{"name":"x"}` gives 8 messages for the other four fields and none for name. | POSTs | 2026-11-07 |
| Boundaries: phone 10 and 22 rejected, 11 and 21 accepted by validation; subject 4/101 rejected, 5/100 accepted; description 19/2001 rejected, 20/2000 accepted. Blank phone gives both "Phone may not be blank" and the size message; blank subject/description give "may not be blank" (the empty UI form shows size messages too). | POSTs paired with blank name | 2026-11-07 |
| Malformed email `not-an-email` gives "must be a well-formed email address" (no "Email" prefix on this message). | POST | 2026-11-07 |
| 400 responses: `Content-Type: application/json`, body is a JSON array of strings. | headers | 2026-11-07 |
| Empty UI submit: 8 messages, always the same set, order differs per request (see MSG-ERR-ORDER). | 3 UI + 3 API runs | 2026-11-07 |
| Form fields have no `maxlength` (-1), no `required`, no placeholder; types: email input `type=email`, phone `type=tel`, name/subject `type=text`. | DOM query | 2026-11-07 |
| Label `for` attributes: name, email, phone, subject, message; textarea id is `description`; `getByLabel('Message')` count 0 (A11Y-MSG-LABEL). | DOM query | 2026-11-07 |
| Error alert: `div.alert.alert-danger`, 8 `<p>` for an empty form; no role, aria-live or aria-atomic on it or its ancestors up to `#contact` (A11Y-ALERT-LIVE); Submit button stays visible. | DOM query, 2/2 | 2026-11-07 |
| Axe through the suite config (tags wcag2a, wcag2aa, wcag21a, wcag21aa, include `#contact`): `[{ id: 'label', impact: 'critical', nodes: 1 }]` in the initial state and after an empty submit. | axe via suite config, 2/2 each | 2026-11-07 |
| Alert behaviour: after an empty submit there is 1 alert; after installing the success mock and submitting valid values the alert count is 0, the form is gone and the thank-you heading appears. A second empty submit (no mock) REPLACES the alert (1 alert, 8 `<p>`), it is not duplicated. | UI runs, 2/2 | 2026-11-07 |
| Mocked success: request is JSON `Content-Type: application/json` with the 5 keys; afterwards `#contact form` count 0 and `#contact` has no link or button, i.e. no way back to the form without reloading. Text: "Thanks for getting in touch Test Guest!", "We'll get back to you about", subject, "as soon as possible." | route mock | 2026-11-07 |
| Page-wide `getByRole('alert')` returned 1 element in the triage after an empty submit; probably the Next.js route announcer (not verified). Hence any role=alert assertion must be scoped to `#contact`. | triage | 2026-11-07 |

## Not verified
- Real 200 success path (by design: no valid submission made outside the budgeted two); response headers of a real 200.
- Server-side truncation or limits above 2000 for description, and upper limits for email (a very long name of 1000 chars passed validation only).
- Unicode/emoji, HTML/script characters in fields and their rendering in the success heading (XSS check) - not explored; proposed as TC-08 (round 2) with mocked response only.
- Behaviour on mobile viewport; keyboard-only submit; Enter key in fields (button is type=button, so Enter probably does nothing).
- Whether the demo resets messages periodically.
- Behaviour of `GET /api/message/{id}` with admin token (not needed, not run).
- Page-wide `getByRole('alert')` element identity (probably the Next.js route announcer, not verified); contrast and other axe rules outside the suite tag set.

## Test Scenarios

### 1. 1. Contact form - E2E (tests/e2e, tag @contact)

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-01: visitor sends a message and sees the thank-you (REAL submission, chromium only; not @smoke, owner decision 2026-11-07)

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Generate this test inside its OWN `test.describe` block (only this test) in `tests/e2e/contact-form.spec.ts`, with `test.describe.configure({ retries: 0 })` as the first statement, so CI never resubmits and other tests keep the config retries. Add `test.skip(browserName !== 'chromium', 'creates a real message; once per full run')`. Creates data: YES (1). Projects: e2e-chromium only. Fixme / finding: no. Open the home page via `homePage.goto()` and scroll to `#contact`.
    - expect: Form visible with fields Name, Email, Phone, Subject, Message and button Submit
  2. Fill with `contactMessage()` as is via `fillContact()`, click Submit
    - expect: Request is a POST /api/message returning 200
    - expect: `homePage.contact.successHeading` is visible and contains the name; the subject and 'as soon as possible.' are shown
    - expect: `#contact form` no longer present

#### 1.2. TC-02: mocked success shows the thank-you with name and subject, and the form is gone

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: e2e-chromium, e2e-firefox, e2e-webkit. Fixme / finding: no. Call `homePage.mockContactSuccess()` before interacting (POST mocked, other methods continue). Fill all fields with factory data, click Submit.
    - expect: Exactly one POST observed with JSON body of the 5 keys (name, email, phone, subject, description) matching the typed values, Content-Type application/json
    - expect: `homePage.contact.successHeading` is visible and contains the guest name, the subject appears, text 'as soon as possible.' visible
    - expect: form and Submit button are gone; there is no link back to the form (documented behaviour)

#### 1.3. TC-03: empty submit shows the eight blank/size errors

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Creates data: no (400). Projects: e2e-chromium, e2e-firefox, e2e-webkit. Fixme / finding: no (order instability is MSG-ERR-ORDER, so this test must NOT depend on order). Open home page, click Submit with all fields empty.
    - expect: `homePage.contact.errorAlert` visible, exactly one, with 8 paragraphs (count 8)
    - expect: Assert membership of each of the 8 strings (never order): Subject may not be blank, Name may not be blank, Message must be between 20 and 2000 characters., Message may not be blank, Phone must be between 11 and 21 characters., Phone may not be blank, Subject must be between 5 and 100 characters., Email may not be blank
    - expect: Form still visible and fields still empty

#### 1.4. TC-04: each of name, phone, description blank on its own is reported and the others are not (parametrised x3)

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: e2e-chromium only (`test.skip(browserName !== 'chromium', ...)`). Fixme / finding: no. Rows: name, phone, description (email and subject blanks are covered at API level by API-04 and API-06). For each row fill the other four fields with valid factory values and leave the row's field blank; a blank field is always rejected, so nothing is created.
    - expect: Alert contains that field's 'may not be blank' message (Name may not be blank / Phone may not be blank / Message may not be blank)
    - expect: Alert contains no message for any other field
    - expect: No success heading

#### 1.5. TC-05: malformed email is rejected

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: e2e-chromium, e2e-firefox, e2e-webkit. Fixme / finding: no. Fill name valid, email `not-an-email`, phone '', subject/description valid (phone blank guarantees rejection even if email were accepted). Click Submit.
    - expect: Alert contains 'must be a well-formed email address' and 'Phone may not be blank'
    - expect: No success heading

#### 1.6. TC-06: phone, subject and message out of range are rejected from the UI

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: e2e-chromium. Fixme / finding: no. Fill name valid, email valid, phone 10 digits, subject 4 chars, message 19 chars; click Submit.
    - expect: Alert contains the three size messages: Phone must be between 11 and 21 characters., Subject must be between 5 and 100 characters., Message must be between 20 and 2000 characters.
    - expect: Alert does not contain the Name or Email messages

#### 1.7. TC-07: a corrected form after an error can be resubmitted (mocked success); the alert is gone

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Creates data: no (first POST invalid, second mocked). Projects: e2e-chromium, e2e-firefox, e2e-webkit. Fixme / finding: no. Click Submit with the form empty.
    - expect: `homePage.contact.errorAlert` is visible (1 alert)
  2. Call `homePage.mockContactSuccess()`, fill valid factory data, click Submit again.
    - expect: `homePage.contact.errorAlert` toHaveCount(0)
    - expect: `homePage.contact.successHeading` is visible
    - expect: The form is gone (verified 2/2: after the mocked submit alert count 0, form gone, thank-you heading shown)

### 2. 2. Contact form - API (tests/api, tag @contact)

**Seed:** `tests/seed.spec.ts`

#### 2.1. API-01: valid message from factory defaults is accepted (REAL, the only API submission; not @smoke, owner decision 2026-11-07)

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Generate this test inside its OWN `test.describe` block (only this test) in `tests/api/contact-message.spec.ts`, with `test.describe.configure({ retries: 0 })` as the first statement, so CI never resubmits. Creates data: YES (1). Projects: api (once). Fixme / finding: no. `api.sendMessage()` with `contactMessage()` defaults, so the name ('Qa... Agent...') and the subject ('Automated suite check') identify the suite. Phone MAY be overridden (optional) with an 11-char synthetic value `07700900` + 3 digits (e.g. `07700900123`). No minimum-length subject or description is used and no boundary is tested here (boundaries live in API-05/06/07).
    - expect: Status 200, Content-Type application/json, body `{"success":true}` (no id returned)

#### 2.2. API-02: empty object and missing fields return 400 with the full message set

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. POST `{}`; then POST `{"name":"x"}`.
    - expect: Both 400, JSON array of strings
    - expect: `{}` body contains (membership) Name may not be blank, Name must be set, Email may not be blank, Email must be set, Phone may not be blank, Phone must be set, Subject may not be blank, Subject must be set, Message may not be blank, Message must be set
    - expect: `{"name":"x"}` contains the same messages for the four other fields and no 'Name ...' message

#### 2.3. API-03: blank name is rejected; whitespace-only name too (guarded)

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no (every row has an invalid field). Projects: api. Fixme / finding: no. Row 1: name '' with all other fields valid (the blank name alone makes it invalid). Row 2: name ' ' (single space) with phone '' as guard, so it can never create a message if the server starts accepting whitespace; other fields valid.
    - expect: Row 1 (name ''): 400; body contains 'Name may not be blank'; body contains no Email/Phone/Subject/Message messages
    - expect: Row 2 (name ' ' + phone ''): 400; body contains 'Name may not be blank' and 'Phone may not be blank'

#### 2.4. API-04: blank email and malformed emails are rejected

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. Parametrise email in '' , 'not-an-email'; ALSO set name '' in each request so it cannot be accepted even if the email rule changes. Others valid. (Additional malformed values such as 'a@', '@example.test', 'a b@example.test' must be added only with the same blank-name guard; their messages are NOT verified.)
    - expect: 400; '' -> body contains 'Email may not be blank'; 'not-an-email' -> body contains 'must be a well-formed email address'
    - expect: Both bodies contain 'Name may not be blank' (guard)

#### 2.5. API-05: phone length boundaries (10, 11, 21, 22) and blank

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. Technique: every request also has name '' (guard). Send phone lengths '', 10, 11, 21, 22 chars. Valid minimum (11) and maximum (21) are both covered here.
    - expect: All 400 and contain 'Name may not be blank'
    - expect: 10, 22 and '' -> body contains 'Phone must be between 11 and 21 characters.'; '' also contains 'Phone may not be blank'
    - expect: 11 and 21 -> body does NOT contain any Phone message (valid boundaries proven without creating data)

#### 2.6. API-06: subject length boundaries (4, 5, 100, 101) and blank

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. Name '' guard in every request. Subject lengths '', 4, 5, 100, 101. Valid minimum (5) and maximum (100) are both covered here.
    - expect: All 400 with 'Name may not be blank'
    - expect: '' -> 'Subject may not be blank'; '', 4, 101 -> 'Subject must be between 5 and 100 characters.'
    - expect: 5 and 100 -> no Subject message

#### 2.7. API-07: description length boundaries (19, 20, 2000, 2001) and blank

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. Name '' guard in every request. Description lengths '', 19, 20, 2000, 2001. Valid minimum (20) and maximum (2000) are both covered here.
    - expect: All 400 with 'Name may not be blank'
    - expect: '' -> 'Message may not be blank'; '', 19, 2001 -> 'Message must be between 20 and 2000 characters.'
    - expect: 20 and 2000 -> no Message message

#### 2.8. API-09: unknown extra field is ignored and does not change validation

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. Valid name/email/subject/description, phone '', extra key `extra:'x'`.
    - expect: 400 with only the Phone messages; no message mentioning 'extra'

#### 2.9. API-10: 400 responses are JSON arrays of strings

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme / finding: no. Send one invalid request (all blank).
    - expect: Status 400, header content-type contains application/json, body is an array whose elements are all non-empty strings, no duplicates

#### 2.10. API-11: non-JSON or malformed body is rejected with a 4xx, not 500 (finding MSG-BADBODY-500)

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no (bodies cannot be valid messages). Projects: api. Fixme: YES, `test.fixme()` with finding MSG-BADBODY-500 (confirmed 2/2). Send (a) Content-Type text/plain body 'name=&email=', (b) application/json body '{"name":', (c) application/json with no body.
    - expect: Correct behaviour: status 400 or 415 for all three
    - expect: Observed today (2/2 each): 500 application/json `{"error":"Failed to create message"}` for all three -> test.fixme with the reason and the finding ID

#### 2.11. API-12: anonymous GET /api/message and GET /api/message/count must require a token (finding MSG-ANON-READ)

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme: YES, ONE `test.fixme()` with finding MSG-ANON-READ (confirmed 2/2; covers CF-1 list and CF-2 count; former API-13 merged here). Use a cookie-less request (`api`, no token) for GET /api/message and then GET /api/message/count.
    - expect: Correct behaviour: 401 for BOTH requests
    - expect: Observed (2/2 each): GET /api/message -> 200 application/json with names and subjects; GET /api/message/count -> 200 `{"count":n}`. Never assert counts or the content of other people's messages

#### 2.12. API-14: anonymous GET /api/message/1 returns 401, not 500 (finding MSG-ID-500)

**File:** `tests/api/contact-message.spec.ts`

**Steps:**
  1. Creates data: no. Projects: api. Fixme: YES, `test.fixme()` with finding MSG-ID-500 (confirmed 2/2). GET /api/message/1 with no token. Do not open or read it as admin (would mark it read).
    - expect: Correct behaviour: 401
    - expect: Observed (2/2): 500, no content-type, body 'Internal Server Error' -> test.fixme with the reason and the finding ID

### 3. 3. Contact form - Visual (tests/visual, Chromium, Linux baselines)

**Seed:** `tests/seed.spec.ts`

#### 3.1. VR-01: contact form empty state

**File:** `tests/visual/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: visual (Desktop Chrome). Fixme / finding: no. Open home page, scroll to `#contact`, screenshot the `#contact` locator named `VR-01-empty.png`.
    - expect: Matches baseline; nothing to mask (static); baselines regenerated only by CI

#### 3.2. VR-02: contact form error state after an empty submit (finding MSG-ERR-ORDER)

**File:** `tests/visual/contact-form.spec.ts`

**Steps:**
  1. Creates data: no (400). Projects: visual. Fixme: YES, `test.fixme()` with finding MSG-ERR-ORDER (confirmed 2/2; owner decision). Click Submit empty, wait for `homePage.contact.errorAlert`, screenshot `#contact` as `VR-02-error.png`. NO mask anywhere (do not mask `.alert-danger p` or anything else) and no retries.
    - expect: Correct behaviour: deterministic message order, so the error state matches the baseline on every run
    - expect: Observed today: the 8 messages come in a different order each request (3 UI + 3 API runs, 3 different orders each) -> test.fixme with the reason and the finding ID

#### 3.3. VR-03: contact form mocked success state

**File:** `tests/visual/contact-form.spec.ts`

**Steps:**
  1. Creates data: no (mocked). Projects: visual. Fixme / finding: no. Call `homePage.mockContactSuccess()`, fill with fixed text (e.g. 'Test Guest', 'Visual check'), submit, wait for `homePage.contact.successHeading`, screenshot `#contact` as `VR-03-success.png`.
    - expect: Matches baseline; text is fixed so no mask needed

### 4. 4. Contact form - A11Y (tests/a11y)

**Seed:** `tests/seed.spec.ts`

#### 4.1. A11Y-01: axe scan of #contact (initial state; known finding A11Y-MSG-LABEL)

**File:** `tests/a11y/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: a11y (Desktop Chrome). Fixme: no (option A, owner/QA manager decision). Run `scanA11y(page, { include: '#contact' })` (suite tags wcag2a, wcag2aa, wcag21a, wcag21aa). Add annotation `{ type: 'finding', description: 'A11Y-MSG-LABEL' }`.
    - expect: Summary sorted by rule id toEqual exactly `[{ id: 'label', impact: 'critical', nodes: 1 }]` (verified 2/2 in the initial state)
    - expect: When A11Y-MSG-LABEL is fixed this test will fail and must be updated (summary becomes empty)

#### 4.2. A11Y-02: labels Name, Email, Phone and Subject resolve to their controls

**File:** `tests/a11y/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: a11y. Fixme / finding: no (green; these work today). Assert that `getByLabel('Name')`, `getByLabel('Email')`, `getByLabel('Phone')` and `getByLabel('Subject')` each resolve to exactly one element (`toHaveCount(1)`), and that it is the matching testid control (the same element as the field's testid locator from the page object).
    - expect: Each of the four labels resolves to exactly one element, the matching testid control

#### 4.3. A11Y-03: axe scan of the error state after empty submit (known finding A11Y-MSG-LABEL)

**File:** `tests/a11y/contact-form.spec.ts`

**Steps:**
  1. Creates data: no (400). Projects: a11y. Fixme: no (option A). Click Submit empty, wait for `homePage.contact.errorAlert`, run `scanA11y(page, { include: '#contact' })`. Add annotation `{ type: 'finding', description: 'A11Y-MSG-LABEL' }`.
    - expect: Summary sorted by rule id toEqual exactly `[{ id: 'label', impact: 'critical', nodes: 1 }]` (verified 2/2 after an empty submit)
    - expect: No other rule is reported for the alert (the missing live region is not an axe violation; it is covered by A11Y-05)
    - expect: When A11Y-MSG-LABEL is fixed this test will fail and must be updated

#### 4.4. A11Y-04: label 'Message' is associated with the textarea (finding A11Y-MSG-LABEL)

**File:** `tests/a11y/contact-form.spec.ts`

**Steps:**
  1. Creates data: no. Projects: a11y. Fixme: YES, targeted `test.fixme()` with finding A11Y-MSG-LABEL (confirmed 2/2). Assert that `getByLabel('Message')` resolves to the `ContactDescription` textarea (same element as `getByTestId('ContactDescription')`, `id='description'`).
    - expect: Correct behaviour: getByLabel('Message') resolves to exactly one element, the ContactDescription textarea
    - expect: Observed today: count 0 (label for='message', textarea id='description', no element with id message) -> test.fixme with the reason and the finding ID; it turns into a pass once the label is fixed

#### 4.5. A11Y-05: the contact error alert is announced to screen readers (finding A11Y-ALERT-LIVE)

**File:** `tests/a11y/contact-form.spec.ts`

**Steps:**
  1. Creates data: no (400). Projects: a11y. Fixme: YES, `test.fixme()` with finding A11Y-ALERT-LIVE (confirmed 2/2). Open the home page, click Submit with the form empty, wait for `homePage.contact.errorAlert`.
    - expect: Correct behaviour: `page.locator('#contact').getByRole('alert')` is visible after the empty submit, OR the alert / its container has aria-live polite or assertive. The assertion MUST be scoped to `#contact`: page-wide `getByRole('alert')` returned 1 element in the triage (probably the Next.js route announcer, not verified)
    - expect: Observed today (2/2): `#contact .alert-danger` and all its ancestors up to `#contact` have no role, no aria-live, no aria-atomic -> test.fixme with the reason and the finding ID

### 5. 5. Round 2 (not generated in round 1)

**Seed:** `tests/seed.spec.ts`

#### 5.1. TC-08: special characters in name and subject are rendered as text in the thank-you (mocked) - ROUND 2, NOT GENERATED

**File:** `tests/e2e/contact-form.spec.ts`

**Steps:**
  1. Status: round 2, not generated. Creates data: no (mocked 200 via `homePage.mockContactSuccess()`). Projects: e2e-chromium. Fixme / finding: no. Fill name `<b>Test</b> O'Neil & Co`, subject `<i>subj</i> "q" 日本語` (other fields valid), submit.
    - expect: Heading (`homePage.contact.successHeading`) text contains the literal characters (no HTML interpreted: `locator('#contact b, #contact i')` count 0 apart from the subject's own bold wrapper which is checked by text only)
    - expect: No dialog fired. Marked low priority: behaviour for the real server not verified
