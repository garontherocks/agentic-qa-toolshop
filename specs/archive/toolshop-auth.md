# Auth - test plan

## Application Overview

Area: authentication and authorization of Toolshop (UI https://practicesoftwaretesting.com, API https://api.practicesoftwaretesting.com, Sprint 5, footer "v2.5 | Built 2026-10-11 | Angular 20.0.5"). Planned 2026-11-07, revised 2026-11-07 after human approval, probes, failure-triager results and the round-1 review (generator, healer and reviewer runs).

## Generated in round 1 (P1)
E2E: TC-01, TC-02, TC-03, TC-04, TC-05, TC-07, TC-08, TC-09, TC-10, TC-12, TC-13, TC-17 (fixme), TC-18 (fixme), TC-19 (fixme).
API: API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, API-15, API-16, API-17 (fixme).
A11Y: A11Y-01 (login), A11Y-02 (register): both assert the exact set of known axe violations.
Visual: VR-01, VR-02, VR-03.
Pending (round 2, may keep TBDs, probe before round 2): TC-11, TC-15, TC-16, API-13, API-14, A11Y-03, A11Y-04, VR-04.
Not verified / not generated: TC-06 (stale-token reload loop; not reproduced by the triager, see Not verified / not generated).
Dropped: TC-14 (duplicate email is covered by API-11; only one UI registration test is allowed: TC-13).
Cases marked fixme assert the EXPECTED (correct) behaviour and are generated as test.fixme() with the finding ID and the evidence in the annotation; they are never weakened to pass.

## Scope and seed
In scope: login, logout, session and route protection, role boundaries (anonymous, customer, admin), registration, forgot password, change password, 2FA (TOTP) section visibility only. Out of scope: Google sign-in, real TOTP enrolment, admin CRUD.
Seed: tests/seed.spec.ts (human-written, never edited by agents). Fixtures: loginPage (data-test email, password, login-submit), api, apiAs(role) (calls POST /users/login and expects 2xx), customerPage (signed in as the demo customer, expects URL /account; used only by TC-03-style canary needs and A11Y-04), syntheticCustomerPage (synthetic customer registered by API and signed in through the UI; used by TC-02 and TC-05), syntheticApi (synthetic user for the "customer" role, role user, same 403 statuses as the demo customer; used by API-01, API-02, API-03), syntheticAccount (registers via API and deletes with the admin token). To add (generator): ForgotPasswordPage, ProfilePage for round 2. RegisterPage exists (src/pages/register-page.ts).
Projects: e2e = e2e-chromium, e2e-firefox, e2e-webkit; api = api; a11y = a11y (Desktop Chrome); visual = visual (Desktop Chrome, Linux baselines only).
Case order: authorization and role boundaries first, then login negatives, registration, change/forgot password, logout and session, then a11y and visual.

## Candidate defects (triaged by the failure-triager on 2026-11-07; see Product findings; no case enshrines the current behaviour as correct)
1. /admin renders a blank page for anonymous and customer. Confirmed as finding ADMIN-BLANK (TC-17, fixme). TC-01/TC-02 assert only that no admin content is shown (no "Sales over the years", no "Latest orders", no nav-admin-* item); they do not assert the URL stays /admin.
2. Refresh 500 without a valid token. Confirmed as finding REFRESH-500 (API-17, fixme). The reload loop with a stale token (TC-06) was NOT reproduced; TC-06 is not generated. API-16 asserts only the valid-token GET.
3. Change-password client error "Cannot read properties of undefined (reading 'value')". Confirmed as finding CHPW-JSERR (TC-18, fixme). TC-16 stays pending.
4. Password minimum: UI hint says 8, UI error says 6, API enforces 8. Confirmed as finding PWD-MIN (TC-19, fixme). API-12 asserts the API boundary only.
5. Three accessibility findings (A11Y-PWD-TOGGLE, A11Y-LANG-LABEL, A11Y-RULES-LIST), confirmed by two identical runs on 2026-11-07; A11Y-01 and A11Y-02 assert exactly these known violations (owner decision 2026-11-07, replaces test.fixme).

## Product findings
Source for ADMIN-BLANK, REFRESH-500, CHPW-JSERR and PWD-MIN: failure-triager run 2026-11-07, each reproduced 2/2. Source for the three A11Y findings: two identical axe runs on 2026-11-07.
| ID | Case | Expected behaviour | Observed behaviour | Evidence |
|---|---|---|---|---|
| ADMIN-BLANK | TC-17 | Anonymous /admin is redirected to /auth/login (h3 "Login"), like /account | Stays on /admin, no headings, no message, only GET /users/me 401, no data leak (anonymous 2/2, customer 2/2). Whether a redirect or a "not authorised" message is intended is an owner decision (open question) | triager 2026-11-07, 2/2 |
| REFRESH-500 | API-17 | GET /users/refresh without a token or with Bearer invalid answers 401 | 500 {"message":"Server Error"} 2/2; POST is 405 (not routed; the UI uses GET) | triager 2026-11-07, 2/2 |
| CHPW-JSERR | TC-18 | No uncaught page error while filling the password form on /account/profile | TypeError: Cannot read properties of undefined (reading 'value') fires when new-password-confirm gets input (before submit); the change still succeeds (POST /users/change-password 200, "Your password is successfully updated!") | triager 2026-11-07, 2/2 |
| PWD-MIN | TC-19 | A 7-character password shows a length error stating a minimum of 8, consistent with the hint "Be at least 8 characters long" and the API (7 gives 422, 8 gives 201) | UI error reads "Password must be minimal 6 characters long." for empty, 6- and 7-character input | triager 2026-11-07, 2/2 |
| A11Y-PWD-TOGGLE | A11Y-01, A11Y-02 | Every button has an accessible name | axe rule button-name (critical): the show-password toggle `<button class="btn btn-outline-secondary">` has no accessible name (login and register) | two identical axe runs 2026-11-07 |
| A11Y-LANG-LABEL | A11Y-01, A11Y-02 | The accessible name contains the visible label text | axe rule label-content-name-mismatch (serious): `language-select` has aria-label "Select language" while the visible text is "EN" | two identical axe runs 2026-11-07 |
| A11Y-RULES-LIST | A11Y-02 | A list contains only li, script or template children | axe rule list (serious): the password-rules `<ul>` directly contains a `<ul>` (register) | two identical axe runs 2026-11-07 |

Candidate #7 (angularx-qrcode 'qrdata is empty' on the profile page) is not triaged; pending.

## Data and cleanup
- Shared database used by many people. Synthetic data only: syntheticUser() from src/data/factories.ts (email qa-agent+<tag>@example.test, password Sx!<tag>Aa9#). No real personal data. Registration payload that returns 201: first_name, last_name, dob, phone, email, password and address {street, house_number, city, state, country, postal_code}; address.house_number must be present.
- Every case that needs a user gets a synthetic user created by API in a fixture and deleted with the demo admin token in teardown (POST /users/login as admin, then DELETE /users/{id}, expect 204). Teardown runs even if the test fails, tolerates 404 (the shared DB can be reset, see Anomalies), and only deletes users the suite created.
- The shared DB is reset/purged within minutes (synthetic users created at about 03:58-04:01 UTC returned 404 by 04:04). Fixtures therefore register right before use, and admin cleanup accepts 204 or 404 (the 404 is recorded as an annotation).
- The token lives 300 s, so fixtures log in close to use (log in as the user or admin just before the call, not in a worker-wide setup).
- TC-13 is the only UI registration and runs only in e2e-chromium; its cleanup is registered by email before submit (at teardown: admin search GET /users/search?q=<email>, then DELETE /users/{id}; verified: the user is found and deleted with 204, no annotation). TC-19 submits nothing (the empty form is invalid, nothing reaches the API).
- API-10 (lockout) creates its own dedicated synthetic user and deletes it in teardown. Lockout is only ever done on that user.
- API-14 (pending) uses @example.test emails only.
- Public demo accounts (admin@, customer@, customer2@practicesoftwaretesting.com, password welcome01): correct-password logins and read-only GETs only. NEVER a wrong password, lockout, password change, profile edit, or any PUT/PATCH/DELETE against their ids.
- The shared demo customer was locked by third parties on 2026-11-07 (423, failed_login_attempts=3; failure-triager: environment). Only TC-03 depends on it, on purpose.
- Avoid login loops; each test signs in at most once. No retries, no waitForTimeout, no force: true, no test.only.

## Verified facts
Kind: url / data-test / endpoint / status / message / account. "probe 2026-11-07" = API call or browser run by the planner on 2026-11-07 against the hosted app, using synthetic users only. "triager 2026-11-07" = failure-triager run, reproduced twice each.

| Fact | Kind | Source |
|---|---|---|
| Nav menubar: Home /, Categories, Contact /contact, Sign in /auth/login (anonymous) | url | snapshots 2026-11-07 |
| Login page /auth/login: h3 "Login", "Sign in with Google", Email address, Password (+ show-password button), button "Login", links "Register your account" /auth/register and "Forgot your Password?" /auth/forgot-password | url | snapshots 2026-11-07 |
| Login data-test ids email, password, login-submit, nav-sign-in; failed-login message element data-test login-error | data-test | booker-domain skill; login-error: probe 2026-11-07 |
| Empty login submit: "Email is required", "Password is required"; email "not-an-email": "Email format is invalid" | message | snapshots 2026-11-07 |
| UI login with unknown email: "Invalid email or password", POST /users/login 401 | message/status | snapshots 2026-11-07 |
| UI login with a wrong password for an existing synthetic user: POST /users/login 401, text "Invalid email or password" shown in data-test login-error, URL stays /auth/login | message/status | probe 2026-11-07 |
| Register /auth/register: h3 "Customer registration"; data-test register-form, first-name, last-name, dob, country, postal_code, house_number, street, city, state, phone, email, password, register-submit, postcode-lookup-hint | data-test | live checks 2026-11-07 |
| Register empty submit messages (13 verified, asserted by TC-12 and awaited by VR-03): "First name is required", "Last name is required", "Please enter a valid date in YYYY-MM-DD format.", "Date of Birth is required", "Country is required", "Postcode is required", "House number is required", "Street is required", "City is required", "State is required", "Phone is required.", "Email is required", "Password is required". Also shown but not asserted (finding PWD-MIN, rules text): "Password must be minimal 6 characters long.", "Password can not include invalid characters." The `*-error` data-test ids of these messages are unverified | message | snapshots 2026-11-07 |
| Register length error shows only after clicking register-submit on the otherwise empty form; typing a short password and blurring shows nothing | message | generator 2026-11-07 |
| Register password hint "Be at least 8 characters long"; the UI error "Password must be minimal 6 characters long." is shown for empty, 6- and 7-character input (finding PWD-MIN) | message | triager 2026-11-07, 2/2 |
| UI registration: country select option value NL, label "Netherlands (the)"; after country + postal code "0000 AA" + house number "1" the fields street, city, state are auto-filled asynchronously (within 3 s; observed "Jansenstraat", "Vessem", "Overijssel"), are empty immediately after blur, and stay editable; hint text in postcode-lookup-hint: "Choose your country and enter the postal code and house number. Street, city and state will be filled in automatically." | data-test/message | probe 2026-11-07 |
| UI registration submit with valid data: POST /users/register 201, lands on /auth/login (h3 "Login"), no success message or alert shown | url/status | probe 2026-11-07 |
| TC-13 cleanup: the user is found by admin GET /users/search?q=<email> and deleted (204), no annotation | endpoint/status | reviewed round 1, 2026-11-07 |
| Login as the newly registered user: URL /account, h "My account", nav-menu text "QA Agent <tag>" | url | probe 2026-11-07 |
| After sign-out (nav-menu, nav-sign-out) going to /account ends on /auth/login | url | probe 2026-11-07 |
| Forgot password /auth/forgot-password: h1 "Forgot Password"; data-test forgot-password-form, email, forgot-password-submit | url/data-test | snapshots 2026-11-07 |
| Anonymous /account and /account/profile end on /auth/login | url | live check 2026-11-07 |
| Anonymous /admin stays on /admin: no headings, no message, only GET /users/me 401, no data leak (anonymous 2/2, customer 2/2) | url/status | triager 2026-11-07 |
| Settle signals: for anonymous, nav-sign-in visible; for a signed-in customer, nav-menu open with nav-my-account visible | data-test | reviewed round 1, 2026-11-07 |
| Customer correct login lands /account ("My account"); nav-menu items nav-my-account, nav-my-favorites, nav-my-profile, nav-my-invoices, nav-my-messages, nav-sign-out | account/data-test | live checks 2026-11-07 |
| Admin correct login lands /admin/dashboard; headings "Sales over the years", "Latest orders"; nav-menu top-level items nav-admin-dashboard, -brands, -categories, -products, -orders, -users, -messages, -settings, nav-sign-out; nav-menu text "John Doe" | account/data-test | live check 2026-11-07 |
| Admin report items nav-admin-statistics, nav-average-month-sales and nav-average-week-sales sit in a nested "Reports" submenu of nav-menu; the trigger is `<button id="reportsDropdown">Reports</button>` (no data-test, role button "Reports") and the submenu opens on HOVER, not click (a click closes nav-menu) | data-test | healer 2026-11-07 |
| The nine nav-admin-* ids are dashboard, brands, categories, products, orders, users, messages, settings, statistics | data-test | reviewed round 1, 2026-11-07 |
| Profile /account/profile data-test: page-title, first-name, last-name, email, phone, street, postal_code, city, state, country, update-profile-submit, current-password, new-password, new-password-confirm, change-password-submit, totp-error | data-test | live check 2026-11-07 |
| Profile password form: input in new-password-confirm throws pageerror "TypeError: Cannot read properties of undefined (reading 'value')" before submit; submitting still succeeds (POST /users/change-password 200, "Your password is successfully updated!") | message/status | triager 2026-11-07, 2/2 |
| The UI refresh call is GET /users/refresh (not POST) | endpoint | triager 2026-11-07 |
| The auth token is stored in localStorage key auth-token | data-test | triager 2026-11-07 |
| POST /users/login (valid) 200, body keys exactly access_token, token_type ("bearer"), expires_in (300) | status/keys | probe 2026-11-07 |
| POST /users/login wrong password for an existing user, and unknown email: both 401, body {"error":"Unauthorized"} (no "Invalid email or password" in the API body) | status/message | probe 2026-11-07 |
| Lockout: for a synthetic user, 3 wrong-password logins return 401, the 4th returns 423 {"error":"Account locked, too many failed attempts. Please contact the administrator."}; the correct password afterwards also returns 423 with the same body | status/message | probe 2026-11-07 (one user, one run) |
| API-10 repeat: 3 isolated runs on 2026-11-07, see evidence log | status/message | evidence log 2026-11-07 |
| The shared demo customer was locked by third parties on 2026-11-07 (423, failed_login_attempts=3) | account/status | failure-triager 2026-11-07: environment |
| GET /users: anonymous 401 {"message":"Unauthorized"}; bearer "invalid" 401 {"message":"Unauthorized"}; customer 403 {"message":"Forbidden"}; admin 200, top-level keys current_page, data, from, last_page, per_page, to, total; data item keys id, provider, first_name, last_name, phone, dob, email, totp_enabled, created_at, address, enabled, role, failed_login_attempts | status/keys | probe 2026-11-07 |
| GET /users/me: anonymous 401 {"message":"Unauthorized"}; customer 200, keys id, provider, first_name, last_name, phone, dob, email, totp_enabled, created_at, address {street, house_number, city, state, country, postal_code}; email = the caller's own email; no password key | status/keys | probe 2026-11-07 |
| GET /reports/total-sales-of-years: anonymous 401 {"message":"Unauthorized"}; customer 403 {"message":"Forbidden"}; admin 200, array of {year, total} | status/keys | probe 2026-11-07 |
| GET /invoices anonymous 401 {"message":"Unauthorized"} | status | probe 2026-11-07 |
| User A (synthetic) on user B (synthetic): GET /users/{B} 404 {"error":"You are not authorized to view this user."}; PUT /users/{B} 403 {"error":"You can only update your own data."}; DELETE /users/{B} 403 {"message":"Forbidden"}; anonymous DELETE /users/{B} 401 {"message":"Unauthorized"}; admin GET /users/{B} afterwards 200 with first_name "QA", unchanged | status/message | probe 2026-11-07 |
| Admin DELETE /users/{id} 204; user deleting self 403 | status | booker-domain skill, probe 2026-11-07 (admin DELETE 204 confirmed for 2 users) |
| POST /users/register 201, body keys first_name, last_name, dob, phone, email, id, created_at, address {street, house_number, city, state, country, postal_code}; no password key | status/keys | probe 2026-11-07 |
| POST /users/register same email again: 409 {"email":["A customer with this email address already exists."]} | status/message | probe 2026-11-07 |
| POST /users/register empty body {}: 422 with keys first_name "The first name field is required.", last_name "The last name field is required.", email "The email field is required.", password "The password field is required." (each an array with one string); dob, phone, address are not reported as required | status/message | probe 2026-11-07 |
| POST /users/register password boundary (upper, lower, digit, symbol present): 5, 6 and 7 characters give 422 {"password":["The password field must be at least 8 characters."]}; 8 characters gives 201 | status/message | probe 2026-11-07 |
| GET /users/logout anonymous 401; with a valid token 200 {"message":"Successfully logged out"}; GET /users/me with the same token afterwards 401 {"message":"Unauthorized"} | status/message | probe 2026-11-07 |
| /users/refresh: GET without a token 500 {"message":"Server Error"} 2/2 and GET with Authorization: Bearer invalid 500 {"message":"Server Error"} 2/2 (finding REFRESH-500); POST 405 {"message":"Method is not allowed for the requested route"} (not routed); GET with valid token 200, keys access_token, token_type, expires_in | status/message | probe 2026-11-07; triager 2026-11-07 |
| axe on /auth/login and /auth/register (two identical runs): button-name (critical) for the show-password toggle (login, register); label-content-name-mismatch (serious) for language-select (aria-label "Select language" vs visible "EN"); list (serious) for the password-rules ul that directly contains a ul (register) | message | a11y runs 2026-11-07, 2/2 |
| Swagger UI /api/documentation (Toolshop API 5.0.0); spec JSON /docs?api-docs.json | endpoint | live check 2026-11-07 |
| JWT has a role claim (user / admin) and lives 300 s | status | booker-domain skill (API response 2026-11-07) |

## Not verified / not generated
1. Forgot-password: input that yields 422 vs 404, success message (TC-15, API-14 pending; probe before round 2).
2. Change-password: messages and status mapping (400/401/422) for wrong current or invalid new password (TC-16, API-13 pending; probe before round 2). The success path (200, "Your password is successfully updated!") and the client JS error are verified (TC-18).
3. Profile page of the signed-in user, TOTP section and "qrdata is empty" console error (A11Y-04 pending; candidate #7 not triaged).
4. Whether the UI shows "Login failed" instead of "Invalid email or password" in some login failures: one UI attempt for a user that had meanwhile been wiped by a DB reset showed "Login failed" (API status of that attempt not captured). Not asserted anywhere.
5. Cadence and trigger of the shared-DB reset (see Anomalies); observed purge within minutes.
6. Lockout threshold: measured by the planner probe and repeated in 3 isolated API-10 runs on 2026-11-07 (see evidence log); API-10 asserts the exact threshold (3 x 401 then 423). If it varies, triage. Whether the lock expires: not verified.
7. TC-06 (stale-token reload loop): NOT generated. The triager did not reproduce the reload loop on 2026-11-07 (0/4: invalid string x2, forged-expired JWT x2; the token is in localStorage key auth-token; each run ended after 2 navigations). Revisit only if new evidence appears.
8. Swagger lock icons per endpoint: not verified. Google sign-in: not explored.
9. The `*-error` data-test ids of the register validation messages: unverified; tests locate messages by text.

## Anomalies recorded during probing
- Shared DB reset: six synthetic users created by the probe (all with 201) returned 404 on admin GET /users/{id} a few minutes later, and GET /users showed total 3 (before: 15 users on page 1). The triager confirmed it: synthetic users created at about 03:58-04:01 UTC returned 404 by 04:04. The DB appears to be reset to seed state periodically. Consequences: synthetic users can vanish mid-run; fixtures must create the user right before use and teardown must tolerate 404.
- Demo customer locked on 2026-11-07 by third parties (423, failed_login_attempts=3); classified as environment by the failure-triager. Only TC-03 depends on that account, on purpose, as the single demo-customer canary.

## Open questions for the human
1. Password minimum: ANSWERED. The enforced minimum is 8 (API); the UI message "minimal 6" is finding PWD-MIN (TC-19, fixme). API-12 asserts 7 gives 422 and 8 gives 201; TC-12 still does not assert the 6.
2. Lockout threshold: CLOSED. Exact threshold asserted in API-10 (3 x 401, then 423 on the 4th attempt, and 423 for the correct password afterwards); if it varies, triage.
3. Should the UI success path after registration show a message? Today it redirects to /auth/login silently; TC-13 asserts only the redirect.
4. API-16: ANSWERED. It asserts only the valid-token GET (200 plus keys); anonymous behaviour is finding REFRESH-500 (API-17).
5. Add the verified ids and facts above to the booker-domain skill (the planner does not edit it).
6. /admin for anonymous visitors: is a redirect to /auth/login or a "not authorised" message intended? TC-17 asserts the redirect, consistent with /account. Owner decision.

## Test Scenarios

### 1. E2E (tests/e2e)

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-01: anonymous visitors cannot reach account pages or see admin content

**File:** `tests/e2e/auth/tc-01-anonymous-cannot-reach-account-or-admin-content.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: yes
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: fresh browser context, not signed in, fixture page
Data & cleanup: none created, nothing to clean up
File: tests/e2e/auth/tc-01-anonymous-cannot-reach-account-or-admin-content.spec.ts
  2. Go to /account, then to /account/profile
    - expect: Each ends on /auth/login with the heading 'Login'
  3. Go to /admin and wait for the settle signal: nav-sign-in visible
    - expect: No heading 'Sales over the years' or 'Latest orders' is visible
    - expect: Each of the 9 nav-admin-* ids (dashboard, brands, categories, products, orders, users, messages, settings, statistics) has toHaveCount(0)
    - expect: The URL is NOT asserted here (see TC-17 for the redirect expectation, finding ADMIN-BLANK)

#### 1.2. TC-02: a customer cannot see admin content at /admin

**File:** `tests/e2e/auth/tc-02-customer-cannot-see-admin-content.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: fixture syntheticCustomerPage (synthetic customer registered by API right before use, signed in through the UI); not the demo customer
Data & cleanup: synthetic user deleted with the demo admin token in teardown (204; 404 tolerated)
File: tests/e2e/auth/tc-02-customer-cannot-see-admin-content.spec.ts
  2. Confirm the fixture landed on /account, then navigate to /admin and wait for the settle signal: nav-menu open with nav-my-account visible
    - expect: No heading 'Sales over the years' or 'Latest orders' is visible
    - expect: Each of the 9 nav-admin-* ids has toHaveCount(0)
    - expect: The URL and any message are NOT asserted (owner decision pending, finding ADMIN-BLANK)

#### 1.3. TC-03: a customer signs in and lands on My account

**File:** `tests/e2e/auth/tc-03-customer-signs-in-and-lands-on-my-account.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: yes
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: loginPage, anonymous; the single demo-customer canary on customer@practicesoftwaretesting.com, correct password, one login
Data & cleanup: none created; read-only use of the demo account. The shared demo customer was locked by third parties on 2026-11-07; only TC-03 depends on it, on purpose
File: tests/e2e/auth/tc-03-customer-signs-in-and-lands-on-my-account.spec.ts
  2. loginPage.goto(), sign in as customer@practicesoftwaretesting.com with welcome01
    - expect: POST /users/login returns 200
    - expect: URL matches /account, heading 'My account' visible
    - expect: nav-menu visible, nav-sign-in not visible
  3. Open nav-menu
    - expect: nav-my-account, nav-my-favorites, nav-my-profile, nav-my-invoices, nav-my-messages and nav-sign-out are visible

#### 1.4. TC-04: an admin signs in and lands on the dashboard

**File:** `tests/e2e/auth/tc-04-admin-signs-in-and-lands-on-dashboard.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: loginPage, anonymous; demo admin, correct password, one login, read-only
Data & cleanup: none created; never create, edit or delete anything as admin in this case
File: tests/e2e/auth/tc-04-admin-signs-in-and-lands-on-dashboard.spec.ts
  2. Sign in as admin@practicesoftwaretesting.com with welcome01
    - expect: URL /admin/dashboard
    - expect: Headings 'Sales over the years' and 'Latest orders' visible
  3. Open nav-menu
    - expect: nav-admin-dashboard, nav-admin-brands, nav-admin-categories, nav-admin-products, nav-admin-orders, nav-admin-users, nav-admin-messages, nav-admin-settings and nav-sign-out are visible
  4. Hover (do NOT click; a click closes nav-menu) the button with role button and name 'Reports' (<button id="reportsDropdown">, no data-test) inside nav-menu
    - expect: The nested Reports submenu opens: nav-admin-statistics, nav-average-month-sales and nav-average-week-sales are visible
    - expect: Verified by the healer, 2026-11-07

#### 1.5. TC-05: signing out returns to login and protects account pages again

**File:** `tests/e2e/auth/tc-05-sign-out-returns-to-login-and-protects-account.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: yes
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: fixture syntheticCustomerPage (synthetic customer registered by API right before use, signed in through the UI); not the demo customer
Data & cleanup: synthetic user deleted with the demo admin token in teardown (204; 404 tolerated); the logout only ends this test's own session
File: tests/e2e/auth/tc-05-sign-out-returns-to-login-and-protects-account.spec.ts
  2. Open nav-menu, click nav-sign-out
    - expect: URL /auth/login
    - expect: nav-sign-in visible, nav-menu not present
  3. Go to /account
    - expect: Ends on /auth/login (verified: probe 2026-11-07)

#### 1.6. TC-06: a stale token does not trap the app in a reload loop (Not verified / not generated)

**File:** `tests/e2e/auth-session.spec.ts`

**Steps:**
  1. Round: Not verified / not generated (moved from Conditional)
Risk: medium
@smoke: no
Projects: e2e-chromium
Preconditions: NOT generated. The failure-triager did not reproduce the reload loop on 2026-11-07 (0/4: invalid string x2, forged-expired JWT x2; the token is in localStorage key auth-token; each run ended after 2 navigations)
Data & cleanup: none created
File: tests/e2e/auth-session.spec.ts (not created)
  2. Kept for reference only: inject an invalid bearer token in localStorage key auth-token, open /account, count requests to /users/me and /users/refresh during the load (bounded, no waiting loop)
    - expect: Expected: ends on /auth/login with a small bounded number of refresh calls and no 500; revisit only if new evidence of the loop appears

#### 1.7. TC-07: submitting an empty login form shows required messages

**File:** `tests/e2e/auth/tc-07-empty-login-form-shows-required-messages.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: loginPage, anonymous
Data & cleanup: none
File: tests/e2e/auth/tc-07-empty-login-form-shows-required-messages.spec.ts
  2. Open /auth/login and click login-submit with both fields empty
    - expect: 'Email is required' and 'Password is required' visible
    - expect: URL stays /auth/login

#### 1.8. TC-08: an invalid email format is rejected before submit

**File:** `tests/e2e/auth/tc-08-invalid-email-format-rejected-before-submit.spec.ts`

**Steps:**
  1. Round: P1
Risk: low
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: loginPage, anonymous
Data & cleanup: none
File: tests/e2e/auth/tc-08-invalid-email-format-rejected-before-submit.spec.ts
  2. Enter email 'not-an-email' and any non-empty password, click login-submit
    - expect: 'Email format is invalid' visible
    - expect: URL stays /auth/login

#### 1.9. TC-09: a non-existent email shows 'Invalid email or password'

**File:** `tests/e2e/auth/tc-09-non-existent-email-shows-invalid-credentials.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: loginPage, anonymous; a never-registered qa-agent+<tag>@example.test email from syntheticUser() and a made-up password
Data & cleanup: nothing is created, nothing to clean up; never a demo account
File: tests/e2e/auth/tc-09-non-existent-email-shows-invalid-credentials.spec.ts
  2. Sign in with those values
    - expect: POST /users/login returns 401
    - expect: 'Invalid email or password' visible (data-test login-error)
    - expect: URL stays /auth/login

#### 1.10. TC-10: a wrong password for a registered synthetic user is rejected

**File:** `tests/e2e/auth/tc-10-wrong-password-for-registered-user-rejected.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: synthetic user created by API in a fixture (POST /users/register returns 201); exactly ONE wrong-password attempt (the lockout is at the 4th)
Data & cleanup: user deleted in teardown with the demo admin token (DELETE /users/{id} 204, 404 tolerated), also when the test fails
File: tests/e2e/auth/tc-10-wrong-password-for-registered-user-rejected.spec.ts
  2. Open /auth/login and sign in once with the synthetic email and a different password
    - expect: POST /users/login returns 401 (verified)
    - expect: 'Invalid email or password' visible in data-test login-error (verified)
    - expect: URL stays /auth/login, nav-sign-in still visible

#### 1.11. TC-11: login page links lead to registration and forgot password

**File:** `tests/e2e/auth-login.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: low
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: loginPage, anonymous; probe before round 2: none needed beyond the facts already listed
Data & cleanup: none
File: tests/e2e/auth-login.spec.ts (not yet created)
  2. Click 'Register your account', go back, click 'Forgot your Password?'
    - expect: URL /auth/register with h 'Customer registration'
    - expect: URL /auth/forgot-password with h 'Forgot Password'

#### 1.12. TC-12: submitting an empty registration form lists every required field

**File:** `tests/e2e/auth/tc-12-empty-registration-form-lists-required-fields.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: anonymous
Data & cleanup: nothing is sent, nothing created
File: tests/e2e/auth/tc-12-empty-registration-form-lists-required-fields.spec.ts
  2. Open /auth/register and click register-submit with every field empty
    - expect: Visible: 'First name is required', 'Last name is required', 'Date of Birth is required', 'Please enter a valid date in YYYY-MM-DD format.', 'Country is required', 'Postcode is required', 'House number is required', 'Street is required', 'City is required', 'State is required', 'Phone is required.', 'Email is required', 'Password is required'
    - expect: The password-minimum text ('minimal 6 characters') and 'invalid characters' are NOT asserted here (finding PWD-MIN is covered by TC-19)
    - expect: URL stays /auth/register, no POST /users/register is sent

#### 1.13. TC-13: a new customer can register through the UI and then sign in

**File:** `tests/e2e/auth/tc-13-new-customer-registers-through-ui-and-signs-in.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: yes
Projects: e2e-chromium only (skip the other e2e projects inside the test; this is the only UI registration)
Preconditions: syntheticUser() data, anonymous; the user is created by the UI, not by API
Data & cleanup: cleanup is registered by email BEFORE submit; at teardown (runs even on failure) the demo admin searches GET /users/search?q=<email> and then DELETE /users/{id} expects 204 (404 tolerated). Verified: the user is found and deleted (204), no annotation
File: tests/e2e/auth/tc-13-new-customer-registers-through-ui-and-signs-in.spec.ts
  2. Open /auth/register. Fill first-name 'QA', last-name 'Agent <tag>', dob '1990-01-01', select country 'Netherlands (the)' (value NL), fill postal_code '0000 AA', house_number '1', phone '0000000000', email, password
    - expect: After blur, street, city and state are auto-filled asynchronously (observed Jansenstraat / Vessem / Overijssel within 3 s) and stay editable; wait with a web-first assertion (toHaveValue not empty), never a fixed timeout
  3. Overwrite street '1 Test Street', city 'Testville', state 'TS', then click register-submit
    - expect: POST /users/register returns 201
    - expect: Lands on /auth/login with h3 'Login'; no success message or alert is shown (verified), so none is asserted
  4. Sign in with the new credentials
    - expect: URL /account, heading 'My account', nav-menu text starts with 'QA Agent'

#### 1.14. TC-14: registering an already used email is refused in the UI (Dropped)

**File:** `none (not created)`

**Steps:**
  1. Round: Dropped
Risk: medium
@smoke: no
Projects: none (not generated)
Preconditions: DROPPED: duplicate email is covered by API-11 (409); only one UI registration test is allowed (TC-13)
Data & cleanup: none
File: none (not created)

#### 1.15. TC-15: forgot-password form validates input and shows an outcome

**File:** `tests/e2e/auth-forgot-password.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: medium
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: anonymous; non-existent @example.test email only; TBD: validation message and 404 vs 422 outcome (probe before round 2)
Data & cleanup: nothing created
File: tests/e2e/auth-forgot-password.spec.ts (not yet created)
  2. Open /auth/forgot-password, click forgot-password-submit with the email empty, then submit a non-existent email
    - expect: Validation message TBD; outcome message and status TBD

#### 1.16. TC-16: a synthetic customer can change their password and sign in with the new one

**File:** `tests/e2e/auth-change-password.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: medium
@smoke: no
Projects: e2e-chromium
Preconditions: synthetic user by API fixture, signed in through the UI; never a demo account; the client JS error on the form is finding CHPW-JSERR (TC-18); the success path (POST /users/change-password 200, 'Your password is successfully updated!') is verified; TBD: messages and statuses for wrong current or invalid new password (probe before round 2)
Data & cleanup: user deleted with admin token in teardown
File: tests/e2e/auth-change-password.spec.ts (not yet created)
  2. Open nav-menu, nav-my-profile; submit a wrong current password; then the correct one with a valid new password; sign out and sign in with the new password
    - expect: Messages and statuses TBD; must not assert the absence of the JS error (that is TC-18)

#### 1.17. TC-17 [ADMIN-BLANK]: an anonymous visitor opening /admin is redirected to the login page

**File:** `tests/e2e/auth/tc-17-admin-route-redirects-anonymous.spec.ts`

**Steps:**
  1. Round: P1 (generated as test.fixme(), asserts the EXPECTED behaviour)
Finding: ADMIN-BLANK
Evidence: failure-triager run 2026-11-07, attempts 2/2 (anonymous 2/2, customer 2/2): /admin stays on /admin, no headings, no message, only GET /users/me 401, no data leak
Risk: high
@smoke: no
Projects: e2e-chromium, e2e-firefox, e2e-webkit
Preconditions: fresh browser context, not signed in, fixture page. Open question: whether a redirect or a 'not authorised' message is intended is an owner decision; this case asserts the redirect, consistent with /account
Data & cleanup: none created, nothing to clean up
File: tests/e2e/auth/tc-17-admin-route-redirects-anonymous.spec.ts
  2. Go to /admin as an anonymous visitor and wait for the app to settle with a web-first assertion
    - expect: Expected (currently failing): the URL ends on /auth/login and the heading h3 'Login' is visible, the same as /account
    - expect: No heading 'Sales over the years' or 'Latest orders' is visible
    - expect: Annotate the test.fixme() with finding ADMIN-BLANK and the triager evidence

#### 1.18. TC-18 [CHPW-JSERR]: the change-password form raises no uncaught page error

**File:** `tests/e2e/auth/tc-18-change-password-form-no-js-error.spec.ts`

**Steps:**
  1. Round: P1 (generated as test.fixme(), asserts the EXPECTED behaviour)
Finding: CHPW-JSERR
Evidence: failure-triager run 2026-11-07, attempts 2/2: TypeError 'Cannot read properties of undefined (reading 'value')' fires when new-password-confirm gets input (before submit); the change itself still succeeds (POST /users/change-password 200, 'Your password is successfully updated!')
Risk: medium
@smoke: no
Projects: e2e-chromium only
Preconditions: fixture syntheticAccount (synthetic customer registered by API right before use), signed in through the UI; never a demo account
Data & cleanup: user deleted with the demo admin token in teardown (204; 404 tolerated and annotated). Nothing is submitted: no password change is needed to show the defect
File: tests/e2e/auth/tc-18-change-password-form-no-js-error.spec.ts
  2. Register a page.on('pageerror') listener that collects errors, then open nav-menu, nav-my-profile and wait for /account/profile
    - expect: URL /account/profile, data-test current-password, new-password and new-password-confirm visible
  3. Fill new-password-confirm only (do NOT click change-password-submit)
    - expect: Expected (currently failing): no pageerror was collected (errors array is empty)
    - expect: Only pageerror is asserted; the 'qrdata is empty' console error (candidate #7, not triaged) is not asserted, and if a different pageerror appears it is reported to triage, never filtered
    - expect: Annotate the test.fixme() with finding CHPW-JSERR and the triager evidence

#### 1.19. TC-19 [PWD-MIN]: the register password length error states the real minimum of 8

**File:** `tests/e2e/auth/tc-19-register-password-length-message.spec.ts`

**Steps:**
  1. Round: P1 (generated as test.fixme(), asserts the EXPECTED behaviour)
Finding: PWD-MIN
Evidence: failure-triager run 2026-11-07, attempts 2/2: the UI error reads 'Password must be minimal 6 characters long.' for empty, 6- and 7-character input; the hint reads 'Be at least 8 characters long'; the API gives 7 -> 422 'The password field must be at least 8 characters.' and 8 -> 201. Generator 2026-11-07: typing and blurring shows no error; it appears only after register-submit
Risk: medium
@smoke: no
Projects: e2e-chromium
Preconditions: anonymous
Data & cleanup: nothing reaches the API (the form is invalid), nothing created
File: tests/e2e/auth/tc-19-register-password-length-message.spec.ts
  2. Open /auth/register and click register-submit on the otherwise empty form (typing in password and blurring shows nothing)
    - expect: A password length error is visible under the password field (locate by its text, no invented data-test id)
    - expect: Expected (currently failing): the password error does NOT contain 'minimal 6' and DOES contain '8 characters'
    - expect: No POST /users/register is sent
    - expect: Annotate the test.fixme() with finding PWD-MIN and the triager evidence

### 2. API (tests/api)

**Seed:** `tests/seed.spec.ts`

#### 2.1. API-01: GET /users is refused without admin rights

**File:** `tests/api/auth/api-01-users-list-by-role.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: api
Preconditions: api (anonymous), a raw request with header Authorization: Bearer invalid, syntheticApi for the 'customer' role (synthetic user, role user, same 403 status as the demo customer), apiAs('admin'); login right before use (300 s token)
Data & cleanup: synthetic user deleted with the demo admin token in teardown (204; 404 tolerated); otherwise read-only
File: tests/api/auth/api-01-users-list-by-role.spec.ts
  2. GET /users anonymously, with bearer 'invalid', and as the synthetic customer
    - expect: Anonymous 401 body {message: 'Unauthorized'}
    - expect: Invalid bearer 401 body {message: 'Unauthorized'}
    - expect: Customer 403 body {message: 'Forbidden'}
  3. GET /users as admin
    - expect: 200; top-level keys current_page, data, from, last_page, per_page, to, total; data items contain id, first_name, last_name, email, role, address

#### 2.2. API-02: GET /users/me needs a token and returns the caller

**File:** `tests/api/auth/api-02-users-me-returns-caller.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: yes
Projects: api
Preconditions: api, syntheticApi for the 'customer' role (role user)
Data & cleanup: synthetic user deleted with the demo admin token in teardown (204; 404 tolerated); otherwise read-only
File: tests/api/auth/api-02-users-me-returns-caller.spec.ts
  2. GET /users/me without token
    - expect: 401 body {message: 'Unauthorized'}
  3. GET /users/me as the synthetic customer
    - expect: 200; keys id, provider, first_name, last_name, phone, dob, email, totp_enabled, created_at, address; email equals the synthetic user's email; no password key

#### 2.3. API-03: reports are not available to anonymous or customers

**File:** `tests/api/auth/api-03-reports-by-role.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: api
Preconditions: api, syntheticApi for the 'customer' role (role user, same 403), apiAs('admin')
Data & cleanup: synthetic user deleted with the demo admin token in teardown (204; 404 tolerated); otherwise read-only
File: tests/api/auth/api-03-reports-by-role.spec.ts
  2. GET /reports/total-sales-of-years anonymous, as the synthetic customer, as admin
    - expect: Anonymous 401 {message: 'Unauthorized'}
    - expect: Customer 403 {message: 'Forbidden'}
    - expect: Admin 200, an array whose items have year and total

#### 2.4. API-04: invoices need authentication

**File:** `tests/api/auth/api-04-invoices-need-authentication.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: api (anonymous)
Data & cleanup: read-only, nothing created
File: tests/api/auth/api-04-invoices-need-authentication.spec.ts
  2. GET /invoices without token
    - expect: 401 body {message: 'Unauthorized'}

#### 2.5. API-05: a customer cannot read or change another user by id

**File:** `tests/api/auth/api-05-customer-cannot-read-or-change-other-user.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: api
Preconditions: two synthetic users A and B created by API fixtures; log in as A just before use; admin token for the final check
Data & cleanup: both users deleted with the demo admin token in teardown (204, 404 tolerated); never target demo ids
File: tests/api/auth/api-05-customer-cannot-read-or-change-other-user.spec.ts
  2. As A, GET /users/{B id}
    - expect: 404 body {error: 'You are not authorized to view this user.'}
  3. As A, PUT /users/{B id} with the full payload minus password and first_name changed to 'QAchanged'
    - expect: 403 body {error: 'You can only update your own data.'}
  4. As admin, GET /users/{B id}
    - expect: 200; first_name is still 'QA' and email is B's email (unchanged)

#### 2.6. API-06: a customer or anonymous caller cannot delete users

**File:** `tests/api/auth/api-06-customer-or-anonymous-cannot-delete-users.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: api
Preconditions: synthetic users A and B by API fixtures; A logged in just before use
Data & cleanup: both deleted with the demo admin token in teardown (204; 404 tolerated); never a demo id
File: tests/api/auth/api-06-customer-or-anonymous-cannot-delete-users.spec.ts
  2. As A, DELETE /users/{B id}
    - expect: 403 body {message: 'Forbidden'}
  3. Anonymous DELETE /users/{B id}
    - expect: 401 body {message: 'Unauthorized'}
  4. As admin, GET /users/{B id}
    - expect: 200: B still exists

#### 2.7. API-07: valid credentials return a bearer token

**File:** `tests/api/auth/api-07-valid-credentials-return-bearer-token.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: yes
Projects: api
Preconditions: synthetic user created by API fixture
Data & cleanup: user deleted with the demo admin token in teardown
File: tests/api/auth/api-07-valid-credentials-return-bearer-token.spec.ts
  2. POST /users/login {email, password}
    - expect: 200; body keys exactly access_token, token_type, expires_in
    - expect: token_type 'bearer', expires_in 300, access_token a non-empty string (never log its value)

#### 2.8. API-08: login with a non-existent email is rejected

**File:** `tests/api/auth/api-08-login-unknown-email-rejected.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: api; a never-registered qa-agent+<tag>@example.test email
Data & cleanup: nothing created; never a demo account
File: tests/api/auth/api-08-login-unknown-email-rejected.spec.ts
  2. POST /users/login with that email and any password
    - expect: 401 body {error: 'Unauthorized'}; no access_token key

#### 2.9. API-09: a wrong password for a registered synthetic user is rejected

**File:** `tests/api/auth/api-09-wrong-password-rejected.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: synthetic user by API fixture; exactly ONE wrong attempt
Data & cleanup: user deleted with the demo admin token in teardown
File: tests/api/auth/api-09-wrong-password-rejected.spec.ts
  2. POST /users/login with a wrong password
    - expect: 401 body {error: 'Unauthorized'}; no access_token key
  3. POST /users/login with the correct password
    - expect: 200 with keys access_token, token_type, expires_in

#### 2.10. API-10: repeated failed logins lock a synthetic account (423)

**File:** `tests/api/auth/api-10-repeated-failed-logins-lock-account.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: its OWN dedicated synthetic user created in the test fixture; never a demo account; exactly 4 wrong-password attempts plus 1 correct-password attempt, one at a time
Data & cleanup: user deleted with the demo admin token in teardown (204; 404 tolerated); no other test may use this user
Notes: isolated repeat runs: 3 isolated runs on 2026-11-07, see evidence log
File: tests/api/auth/api-10-repeated-failed-logins-lock-account.spec.ts
  2. POST /users/login with a wrong password, one request at a time, four times
    - expect: Attempts 1 to 3 each return exactly 401 {error: 'Unauthorized'}
    - expect: Attempt 4 returns exactly 423 body {error: 'Account locked, too many failed attempts. Please contact the administrator.'} (exact threshold asserted; measured by the planner probe and repeated in 3 isolated runs on 2026-11-07, see evidence log; if it varies, triage)
  3. POST /users/login with the correct password (one try)
    - expect: 423 with the same body; no access_token

#### 2.11. API-11: registration accepts valid data and rejects duplicates and empty payloads

**File:** `tests/api/auth/api-11-register-valid-duplicate-and-empty.spec.ts`

**Steps:**
  1. Round: P1
Risk: high
@smoke: no
Projects: api
Preconditions: api, syntheticUser() payload including address.house_number
Data & cleanup: the registered user is deleted with the demo admin token in teardown (204; 404 tolerated)
File: tests/api/auth/api-11-register-valid-duplicate-and-empty.spec.ts
  2. POST /users/register with the synthetic payload
    - expect: 201; keys first_name, last_name, dob, phone, email, id, created_at, address {street, house_number, city, state, country, postal_code}; no password key
  3. POST /users/register again with the same email
    - expect: 409 body {email: ['A customer with this email address already exists.']}
  4. POST /users/register with an empty body {}
    - expect: 422 with first_name 'The first name field is required.', last_name 'The last name field is required.', email 'The email field is required.', password 'The password field is required.'

#### 2.12. API-12: registration enforces the password length boundary

**File:** `tests/api/auth/api-12-register-password-length-boundary.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: api; fresh synthetic emails; passwords with upper, lower, digit and symbol of 7 and 8 characters (e.g. 'Ab1!xyz', 'Ab1!xyzw'); 2 requests
Data & cleanup: the 8-character user is deleted with the demo admin token in teardown (204; 404 tolerated)
File: tests/api/auth/api-12-register-password-length-boundary.spec.ts
  2. POST /users/register with each of the two passwords
    - expect: 7 characters: 422 body {password: ['The password field must be at least 8 characters.']}
    - expect: 8 characters: 201
    - expect: Open question on the minimum is answered: the enforced minimum is 8; the UI message 'minimal 6' is finding PWD-MIN (TC-19)

#### 2.13. API-13: change-password enforces authentication and validation

**File:** `tests/api/auth.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: medium
@smoke: no
Projects: api
Preconditions: synthetic user by API fixture, logged in just before use; never a demo account; TBD: statuses and messages for no token, wrong current password, invalid new password (probe before round 2)
Data & cleanup: user deleted with the demo admin token in teardown
File: tests/api/auth.spec.ts (not yet created; the round-2 file will follow the tests/api/auth/ naming)
  2. POST /users/change-password without token, with a wrong current password, with an invalid new password
    - expect: Statuses and messages TBD (401 / 400 / 422 seen earlier, mapping unknown)

#### 2.14. API-14: forgot-password responds consistently for unknown emails

**File:** `tests/api/auth.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: medium
@smoke: no
Projects: api
Preconditions: api; @example.test emails only; one request; TBD status (404 or 422) and message (probe before round 2)
Data & cleanup: nothing created
File: tests/api/auth.spec.ts (not yet created; the round-2 file will follow the tests/api/auth/ naming)
  2. POST /users/forgot-password {email} with a non-existent @example.test email
    - expect: Status and message TBD

#### 2.15. API-15: logout needs a token and invalidates it

**File:** `tests/api/auth/api-15-logout-needs-token-and-invalidates-it.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: api; synthetic user by API fixture, logged in just before use
Data & cleanup: user deleted with the demo admin token in teardown
File: tests/api/auth/api-15-logout-needs-token-and-invalidates-it.spec.ts
  2. GET /users/logout without token
    - expect: 401 body {message: 'Unauthorized'}
  3. GET /users/logout with the user's token
    - expect: 200 body {message: 'Successfully logged out'}
  4. GET /users/me with the same token
    - expect: 401 body {message: 'Unauthorized'}

#### 2.16. API-16: GET /users/refresh with a valid token returns a new token

**File:** `tests/api/auth/api-16-refresh-with-valid-token.spec.ts`

**Steps:**
  1. Round: P1
Risk: medium
@smoke: no
Projects: api
Preconditions: api; synthetic user by API fixture, logged in just before use; 1 request, no loop
Data & cleanup: user deleted with the demo admin token in teardown (204; 404 tolerated). Anonymous behaviour is NOT part of this case (see API-17)
File: tests/api/auth/api-16-refresh-with-valid-token.spec.ts
  2. GET /users/refresh with the user's valid token (the UI sends GET, verified by the triager)
    - expect: 200 with keys access_token, token_type, expires_in (asserted); never log token values

#### 2.17. API-17 [REFRESH-500]: GET /users/refresh without a valid token is 401

**File:** `tests/api/auth/api-17-refresh-without-valid-token-is-401.spec.ts`

**Steps:**
  1. Round: P1 (generated as test.fixme(), asserts the EXPECTED behaviour)
Finding: REFRESH-500
Evidence: failure-triager run 2026-11-07, attempts 2/2: GET /users/refresh without a token and with Authorization: Bearer invalid both answer 500 {"message":"Server Error"}; POST is 405 (not routed; the UI uses GET)
Risk: medium
@smoke: no
Projects: api
Preconditions: api (anonymous) and a raw request with header Authorization: Bearer invalid; 2 requests, no loop
Data & cleanup: nothing created
File: tests/api/auth/api-17-refresh-without-valid-token-is-401.spec.ts
  2. GET /users/refresh without a token
    - expect: Expected (currently failing): 401; observed 500 {message: 'Server Error'} 2/2
  3. GET /users/refresh with Authorization: Bearer invalid
    - expect: Expected (currently failing): 401; observed 500 {message: 'Server Error'} 2/2
    - expect: Annotate the test.fixme() with finding REFRESH-500 and the triager evidence; POST /users/refresh (405) is not asserted

### 3. Accessibility (tests/a11y)

**Seed:** `tests/seed.spec.ts`

#### 3.1. A11Y-01: the login page has exactly the known axe violations

**File:** `tests/a11y/auth/a11y-01-login-page.spec.ts`

**Steps:**
  1. Round: P1 (asserts the exact known axe violations, each finding in a `finding` annotation)
Findings: A11Y-PWD-TOGGLE (button-name, critical: the show-password toggle <button class="btn btn-outline-secondary"> has no accessible name), A11Y-LANG-LABEL (label-content-name-mismatch, serious: language-select aria-label 'Select language' vs visible 'EN')
Evidence: two identical axe runs on 2026-11-07
Risk: medium
@smoke: no
Projects: a11y
Preconditions: anonymous; scanA11y(page)
Data & cleanup: none
File: tests/a11y/auth/a11y-01-login-page.spec.ts
  2. Open /auth/login and scan; click login-submit empty to show errors and scan again
    - expect: in both states the axe summary (sorted by rule id) equals exactly button-name (critical, 1 node) and label-content-name-mismatch (serious, 1 node); a new or a fixed violation fails the test; no exclude list

#### 3.2. A11Y-02: the registration page has exactly the known axe violations

**File:** `tests/a11y/auth/a11y-02-register-page.spec.ts`

**Steps:**
  1. Round: P1 (asserts the exact known axe violations, each finding in a `finding` annotation)
Findings: A11Y-PWD-TOGGLE (button-name, critical), A11Y-LANG-LABEL (label-content-name-mismatch, serious), A11Y-RULES-LIST (list, serious: the password-rules <ul> directly contains a <ul>)
Evidence: two identical axe runs on 2026-11-07
Risk: medium
@smoke: no
Projects: a11y
Preconditions: anonymous; nothing submitted
Data & cleanup: none
File: tests/a11y/auth/a11y-02-register-page.spec.ts
  2. Open /auth/register and scan (default state only; the error-state scan is not generated yet, round 2)
    - expect: the axe summary (sorted by rule id) equals exactly button-name (critical, 1 node), label-content-name-mismatch (serious, 1 node) and list (serious, 1 node); a new or a fixed violation fails the test; no exclude list

#### 3.3. A11Y-03: the forgot-password page has no critical or serious axe violations

**File:** `tests/a11y/auth/a11y-03-forgot-password-page.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: low
@smoke: no
Projects: a11y
Preconditions: anonymous; nothing submitted
Data & cleanup: none
File: tests/a11y/auth/a11y-03-forgot-password-page.spec.ts (not yet created)
  2. Open /auth/forgot-password and scan
    - expect: No critical or serious violations

#### 3.4. A11Y-04: the profile page of a signed-in customer has no critical or serious axe violations

**File:** `tests/a11y/auth/a11y-04-profile-page.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: medium
@smoke: no
Projects: a11y
Preconditions: customer signed in (prefer a synthetic customer fixture; the demo customer is locked, see Data and cleanup); read-only, no submit; the 'qrdata is empty' console error is candidate #7 (not triaged; pending)
Data & cleanup: none for a demo account; a synthetic user is deleted in teardown
File: tests/a11y/auth/a11y-04-profile-page.spec.ts (not yet created)
  2. Open /account/profile via nav-menu then nav-my-profile and scan
    - expect: No critical or serious violations

### 4. Visual (tests/visual)

**Seed:** `tests/seed.spec.ts`

#### 4.1. VR-01: login form default state

**File:** `tests/visual/auth/vr-01-login-default.spec.ts`

**Steps:**
  1. Round: P1
Risk: low
@smoke: no
Projects: visual (Chromium, Linux baselines only; never run test:visual:update locally)
Preconditions: anonymous; mask notification-bar, chat-toggle, live-activity-toggle, course-promo
Data & cleanup: none
File: tests/visual/auth/vr-01-login-default.spec.ts
  2. Open /auth/login and take toHaveScreenshot('VR-01-login-default.png')
    - expect: Matches the baseline (generated by CI on request)

#### 4.2. VR-02: login validation errors state

**File:** `tests/visual/auth/vr-02-login-errors.spec.ts`

**Steps:**
  1. Round: P1
Risk: low
@smoke: no
Projects: visual (Chromium, Linux baselines only)
Preconditions: anonymous; same masks as VR-01
Data & cleanup: none
File: tests/visual/auth/vr-02-login-errors.spec.ts
  2. Click login-submit with empty fields and take toHaveScreenshot('VR-02-login-errors.png')
    - expect: 'Email is required' and 'Password is required' shown; matches the baseline

#### 4.3. VR-03: registration form validation errors state

**File:** `tests/visual/auth/vr-03-register-errors.spec.ts`

**Steps:**
  1. Round: P1
Risk: low
@smoke: no
Projects: visual (Chromium, Linux baselines only)
Preconditions: anonymous; same masks as VR-01; nothing sent
Data & cleanup: none
Notes: the baseline contains the PWD-MIN text ('minimal 6 characters'); it must be regenerated in CI when PWD-MIN is fixed
File: tests/visual/auth/vr-03-register-errors.spec.ts
  2. Open /auth/register, click register-submit, wait (web-first) for the 13 verified empty-submit messages (the same list as TC-12; not the unverified *-error ids), then take a full-page toHaveScreenshot('VR-03-register-errors.png')
    - expect: All 13 verified messages visible; matches the baseline (generated by CI on request)

#### 4.4. VR-04: forgot-password form default state

**File:** `tests/visual/auth/vr-04-forgot-password-default.spec.ts`

**Steps:**
  1. Round: Pending (round 2)
Risk: low
@smoke: no
Projects: visual (Chromium, Linux baselines only)
Preconditions: anonymous; same masks as VR-01
Data & cleanup: none
File: tests/visual/auth/vr-04-forgot-password-default.spec.ts (not yet created)
  2. Open /auth/forgot-password and take toHaveScreenshot('VR-04-forgot-password-default.png')
    - expect: Matches the baseline
