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
Source: testsmith-io/practice-software-testing README. The database is shared by everyone using the site.

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

## API — verified on 2026-11-06
- `GET /products?page=N` → paginated `{ current_page, data, from, last_page, per_page (9), to, total }`;
  product fields: `id, name, description, price, is_location_offer, is_rental, co2_rating, in_stock,
  is_eco_friendly, product_image, category, brand`.
- `POST /users/login` `{ email, password }` → `{ access_token }` (bearer) — used by `ToolshopClient.login`.

## To verify (do not rely on these until checked)
- Landing page and heading after a customer signs in.
- Which endpoints require auth or the admin role (community notes say DELETE needs admin).

## Product findings
Record confirmed product defects here and in `specs/coverage.md` (ID, behaviour, evidence, date).
