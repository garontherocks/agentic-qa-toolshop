---
name: toolshop-domain
description: Verified facts about the Toolshop app under test (URLs, versions, accounts, data-test ids, API endpoints and validation rules, known product findings). Load when planning, generating, healing or triaging; update it whenever you verify a new fact.
user-invocable: false
---

# Toolshop domain notes

Only verified facts go here, each with how it was verified (browser via Playwright MCP, Swagger, API response)
and the date. If something here turns out to be wrong, fix it and say so in the session log.

## Environments
| Sprint | UI | API (Swagger at `/api/documentation`) |
|---|---|---|
| 5 (default) | https://practicesoftwaretesting.com | https://api.practicesoftwaretesting.com |
| 5 with bugs | https://with-bugs.practicesoftwaretesting.com | https://api-with-bugs.practicesoftwaretesting.com |
| 5 in Docker (CI) | http://localhost:4200 | http://localhost:8091 |
Source: testsmith-io/practice-software-testing README. The hosted database is shared by everyone using the site.
CI never uses the hosted site: Cloudflare challenges GitHub runners (verified 2026-11-07, CI run of PR #5), so each
job starts a private Toolshop with `ci/toolshop/up.sh` and a fresh seed (`docs/ci-toolshop.md`). Facts verified on
the hosted site are assumed to hold in Docker; if one doesn't, record the difference here.

## Seeded accounts (public, from the app's README)
`admin@practicesoftwaretesting.com`, `customer@practicesoftwaretesting.com`,
`customer2@practicesoftwaretesting.com` — password `welcome01`. Use them through `src/support/env.ts`.

## UI — `data-test` ids verified on 2026-11-06 (browser)
- Navigation: `nav-home`, `nav-categories`, `nav-contact`, `nav-sign-in`, `language-select`, `lang-<code>`
- Login (`/auth/login`): `email`, `password`, `login-submit`
- Home/catalogue: `search-query`, `search-submit`, `search-reset`, `sort`, `filters`, `eco-friendly-filter`,
  `category-<id>`, `brand-<id>`, `product-<id>` cards with `product-name`, `product-price`, `co2-rating-badge`,
  `compare-btn`
- Dynamic widgets (mask/exclude): `notification-bar`, `chat-toggle`, `live-activity-toggle`, `course-promo`

## UI — auth area, verified on 2026-11-07 (browser, Playwright MCP; details and sources in `specs/auth.md`)
- Login `/auth/login`: h3 "Login"; links to `/auth/register` and `/auth/forgot-password`.
  Messages: empty submit → "Email is required", "Password is required"; `not-an-email` → "Email format is invalid";
  unknown email → "Invalid email or password" (`POST /users/login` 401).
- Register `/auth/register` (h3 "Customer registration"): `register-form`, `first-name`, `last-name`, `dob`, `country`,
  `postal_code`, `house_number`, `street`, `city`, `state`, `phone`, `email`, `password`, `register-submit`,
  `postcode-lookup-hint`. Empty-submit messages are listed in `specs/auth.md` (Verified facts).
- Forgot password `/auth/forgot-password` (h1 "Forgot Password"): `forgot-password-form`, `email`, `forgot-password-submit`.
- Account menu: `nav-menu` → `nav-my-account`, `nav-my-favorites`, `nav-my-profile`, `nav-my-invoices`,
  `nav-my-messages`, `nav-sign-out`. Admin adds `nav-admin-{dashboard,brands,categories,products,orders,users,
  messages,settings,statistics}`, `nav-average-month-sales`, `nav-average-week-sales`.
- Profile `/account/profile`: `page-title`, `first-name`, `last-name`, `email`, `phone`, `street`, `postal_code`, `city`,
  `state`, `country`, `update-profile-submit`, `current-password`, `new-password`, `new-password-confirm`,
  `change-password-submit`, `totp-error` (TOTP input and Verify button have no data-test).
- Landing after login: customer and customer2 → `/account` (heading "My account"); admin → `/admin/dashboard`
  ("Sales over the years", "Latest orders"). Sign out → `/auth/login` with `nav-sign-in` visible.
- Anonymous `/account` and `/account/profile` → redirected to `/auth/login`. Anonymous or customer `/admin` stays on
  `/admin` with no content rendered (candidate finding, under triage).

## API — verified on 2026-11-06
- `GET /products?page=N` → paginated `{ current_page, data, from, last_page, per_page (9), to, total }`;
  product fields: `id, name, description, price, is_location_offer, is_rental, co2_rating, in_stock,
  is_eco_friendly, product_image, category, brand`.
- `POST /users/login` `{ email, password }` → `{ access_token }` (bearer) — used by `ToolshopClient.login`.

## API — auth, verified on 2026-11-07
- Swagger UI `/api/documentation` (Toolshop API 5.0.0); spec JSON at `/docs?api-docs.json`. Users: POST `/users/register`,
  `/users/login`, `/users/forgot-password`, `/users/change-password`; GET `/users/me`, `/users/logout`, `/users/refresh`,
  `/users`; GET/PUT/PATCH/DELETE `/users/{userId}`; `/users/search`. TOTP: POST `/totp/setup`, `/totp/verify`.
- `POST /users/register` with `syntheticUser()` plus `address.house_number` → **201** with the user (incl. `id`, `address`).
  (API response, 2026-11-07)
- JWT from `/users/login` has a `role` claim (`user` / `admin`) and lives **300 s** (`exp − iat`). (API response)
- `DELETE /users/{id}`: as **admin → 204**, then `GET /users/{id}` → 404 and the user's login → 401. As the user itself → 403.
  Cleanup of synthetic users therefore uses the demo admin token, and only ever on users the suite created. (API response)
- Login 200 → exactly `{ access_token, token_type: "bearer", expires_in: 300 }`. Unknown email or wrong password → 401
  `{"error":"Unauthorized"}`; UI shows it in `data-test=login-error`.
- **Lockout:** 3 wrong passwords → 401 each; the 4th attempt → 423 `{"error":"Account locked, too many failed attempts.
  Please contact the administrator."}`, and the correct password then also gets 423. Shared demo accounts get locked
  by other users of the site (seen on `customer@` 2026-11-07): a 423 on a demo login is an environment problem.
- Role matrix (anon / user / admin): `GET /users` 401 / 403 / 200 (paginated); `/reports/total-sales-of-years` 401 / 403 / 200;
  `/invoices` anon 401; `GET /users/me` anon 401, user 200 (no password field). User A on user B: GET 404
  "You are not authorized to view this user.", PUT 403 "You can only update your own data.", DELETE 403.
- Register: empty body → 422 on exactly first_name, last_name, email, password; duplicate email → 409
  `{"email":["A customer with this email address already exists."]}`; password minimum is **8** (7 → 422).
  UI registration lands on `/auth/login` with no success message.
- `GET /users/logout` with token → 200 `{"message":"Successfully logged out"}` and the token then gets 401 on `/users/me`.
  `GET /users/refresh` with a valid token → 200 with the 3 token keys (POST → 405).
- Admin menu: the report items are in a nested "Reports" submenu (`#reportsDropdown`, no data-test) that opens on hover.
- Synthetic users can disappear within minutes (the shared DB is purged): cleanup must accept 404.

## To verify (do not rely on these until checked)
- TOTP flow, Google sign-in, forgot-password and change-password status mapping (round 2 of `specs/auth.md`).

## Product findings
Record confirmed product defects here and in `specs/coverage.md` (ID, behaviour, evidence, date).

| ID | Behaviour | Test | Evidence | Date |
|---|---|---|---|---|
| ADMIN-BLANK | Anonymous or customer `/admin` stays on `/admin` with an empty page, no redirect or message (no data leaks) | TC-17 | failure-triager 4/4 | 2026-11-07 |
| REFRESH-500 | `GET /users/refresh` without/with invalid token → 500 instead of 401 (UI reload loop not reproduced) | API-17 | failure-triager 2/2 | 2026-11-07 |
| CHPW-JSERR | Typing in `new-password-confirm` logs `TypeError ... reading 'value'`; change still succeeds | TC-18 | failure-triager 2/2 | 2026-11-07 |
| PWD-MIN | Register UI says "minimal 6 characters"; hint and API enforce 8 | TC-19 | failure-triager 2/2 | 2026-11-07 |
| A11Y-PWD-TOGGLE | Show-password button has no accessible name (axe `button-name`, critical) | A11Y-01, A11Y-02 | 2 identical axe runs | 2026-11-07 |
| A11Y-LANG-LABEL | `language-select` aria-label "Select language" vs visible "EN" (axe `label-content-name-mismatch`) | A11Y-01, A11Y-02 | 2 identical axe runs | 2026-11-07 |
| A11Y-RULES-LIST | Password-rules `<ul>` nested directly in a `<ul>` on register (axe `list`) | A11Y-02 | 2 identical axe runs | 2026-11-07 |
