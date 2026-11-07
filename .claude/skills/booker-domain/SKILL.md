---
name: booker-domain
description: Verified facts about the Restful-booker platform under test (URLs, accounts, id and data-testid locators, API endpoints and validation rules, known product findings). Load when planning, generating, healing or triaging; update it whenever you verify a new fact.
user-invocable: false
---

# Restful-booker platform domain notes

Only verified facts go here, each with how it was verified (browser via Playwright MCP, API response, source) and
the date. If something here turns out to be wrong, fix it and say so in the session log.
"Probe 2026-11-07" = requests and a headless Chromium run from a GitHub-hosted runner against the hosted demo.

## The app
- Restful-booker platform by Mark Winteringham (GPL-3.0, github.com/mwinteringham/restful-booker-platform): a
  bed-and-breakfast ("Shady Meadows B&B") with a public front page, a reservation flow and an `/admin` area.
- Hosted demo: https://automationintesting.online. The API is on the same host under `/api` (a Next.js proxy in
  front of the room, booking, message, branding, auth and report services). Reachable from GitHub runners with no
  bot challenge (probe 2026-11-07).
- Shared with everyone who practises on it; record ids stay low, which suggests periodic resets (not confirmed).

## Accounts
- Admin `admin` / `password` — published in the platform README (source). Use it through `src/support/env.ts`.

## UI — probe 2026-11-07
- Front page `/`: h1 "Welcome to Shady Meadows B&B"; sections `#booking` (h3 "Check Availability & Book Your Stay",
  labels Check In / Check Out, button "Check Availability"), `#rooms` (h2 "Our Rooms", one card per room with h5 = room
  type and "Book now"), `#location` (h2 "Our Location"), `#contact` (h3 "Send Us a Message").
- Navigation links: Rooms `/#rooms`, Booking `/#booking`, Amenities `/#amenities`, Location `/#location`,
  Contact `/#contact`, Admin `/admin`.
- Contact form: inputs `#name`, `#email`, `#phone`, `#subject`, textarea `#description`, also `data-testid`
  `ContactName`, `ContactEmail`, `ContactPhone`, `ContactSubject`, `ContactDescription`; button "Submit".
- `/admin` signed out: h2 "Login", `#username`, `#password`, `button#doLogin`; link `#frontPageLink`.
- Contact form (browser via Playwright MCP, 2026-11-07): `<form>` inside `#contact .card-body`; label "Message"
  is `for="message"` but the textarea is `id="description"`, so `getByLabel('Message')` does not find it (use the
  testid). Button "Submit" is `type="button"`; a click sends `POST /api/message` with JSON
  `{ name, email, phone, subject, description }` (no client-side validation: an empty form is posted as-is).
  - 400 → one `div.alert.alert-danger` inside `#contact`, one `<p>` per API message, in the API's order. Empty form
    gives 8: "Subject may not be blank", "Name may not be blank", "Message must be between 20 and 2000 characters.",
    "Message may not be blank", "Phone must be between 11 and 21 characters.", "Phone may not be blank",
    "Subject must be between 5 and 100 characters.", "Email may not be blank". The order is not guaranteed stable
    (Java validator set) — **confirmed non-deterministic** by failure-triager 2026-11-07 (finding MSG-ERR-ORDER, see
    "Contact messages" below); assert membership, not order. The only console error is the 400 itself.
  - 200 (verified with the response **mocked** via `page.route`, no message created) → the form is replaced by
    h3 "Thanks for getting in touch {name}!", then "We'll get back to you about", the subject in bold, and
    "as soon as possible.".
- `/admin` after a UI login (2026-11-07): redirects to `/admin/rooms` (rooms table: Room #, Type, Accessible, Price,
  Room details, plus a create row). Nav: Rooms `/admin/rooms`, Report `#reportLink`, Branding `#brandingLink`,
  Messages `/admin/message` with a red badge = unread count, Front Page `#frontPageLink`, button "Logout". Session
  cookie `token`, path `/`, not httpOnly. `/admin/message` lists Name and Subject per message. Once (1 of 2 tries)
  the admin was bounced to the login form when opening Messages, with `POST /api/auth/validate` → 403: not
  reproduced, not a finding. Do not open messages in the admin: that marks other people's messages as read.
- Shared message box at 22:30 UTC: one seed message (id 1); `GET /api/message/count`
  → `{"count":1}`. Other people's messages come and go: never assert absolute counts.
- Not verified (2026-11-07): the `/reservation/{roomid}?checkin=&checkout=` page ("Book now" links there): the body
  was still empty after a 30 s wait for any heading, in a fresh context.

## API — probe 2026-11-07
- `GET /api/room` → 200 `{ rooms: [{ roomid, roomName, type, accessible, image, description, features[], roomPrice }] }`.
- `GET /api/branding` → 200 `{ name?, address{...}, contact{ name, email, phone }, description, directions, ... }`.
  Never `PUT` it: it changes the demo for everyone.
- `POST /api/auth/login` `{ username, password }`: valid → 200 `{ token }`; wrong password → 401
  `{"error":"Invalid credentials"}`. `POST /api/auth/validate` `{ token }` → 200 `{ valid: true }`.
  `POST /api/auth/logout` `{ token }` → 200 `{ success: true }`. Admin calls send the token as cookie `token=<value>`.
- `POST /api/message` (public): valid → 200 `{"success":true}` (no id returned). Invalid → 400 with an array of
  messages: "Name may not be blank", "must be a well-formed email address", "Phone must be between 11 and 21
  characters.", "Subject must be between 5 and 100 characters.", "Message must be between 20 and 2000 characters."
- `GET /api/message` → 200 `{ messages: [{ id, name, subject, read }] }` **without a token too** (filed as finding
  MSG-ANON-READ after the failure-triager reproduction, 2026-11-07; supersedes "candidate finding").
  Re-confirmed 2026-11-07 from a cookie-less context: 200 with names and subjects; `GET /api/message/count` → 200
  `{"count":n}` anonymously too. `GET /api/message/1` anonymously → 500 (not 401; finding MSG-ID-500). The admin UI
  shows the same list only after login.
- `POST /api/booking` (public) `{ roomid, firstname, lastname, depositpaid, email, phone, bookingdates{checkin,checkout} }`
  → 201 with `bookingid`. Validation 400 `{ errors: [...] }`: firstname 3–18 ("size must be between 3 and 18"),
  lastname 3–30 ("size must be between 3 and 30"), "Lastname should not be blank".
- `GET /api/booking?roomid=` → 401 `{"error":"Authentication required"}` anonymously, 200 `{ bookings: [...] }` as admin.
  `GET /api/booking/summary?roomid=` → 401 anonymously.
- `DELETE /api/booking/{id}` as admin → **500** (probe 2026-11-07): bookings can't be cleaned up on the hosted demo.
- `GET /api/report/room/1` → 500 (probe 2026-11-07).

### Contact messages — planner + failure-triager, 2026-11-07
Planner probe ~22:30 UTC via Playwright `page.request` / `page.evaluate`: invalid requests only, every 200 mocked,
nothing created. Triager reproduction 22:37:57–22:38:22 UTC, 2 runs each, fresh contexts. Findings in
`specs/findings.md`.
- Name rule: only "Name may not be blank". Names of 1, 101 and 1000 chars raise no name message; whitespace-only
  `" "` gives "Name may not be blank" (planner).
- Exact 400 strings (planner): "Name may not be blank", "Name must be set", "Email may not be blank",
  "Email must be set", "must be a well-formed email address", "Phone may not be blank", "Phone must be set",
  "Phone must be between 11 and 21 characters.", "Subject may not be blank", "Subject must be set",
  "Subject must be between 5 and 100 characters.", "Message may not be blank", "Message must be set",
  "Message must be between 20 and 2000 characters.".
- `{}` gives 10 messages, including the "must be set" variants; `{"name":"x"}` gives 8 messages for the other four
  fields and none for name; a blank phone gives both "Phone may not be blank" and the size message (planner).
- Boundaries (planner, each paired with a blank name so nothing was created): phone 10/22 rejected, 11/21 pass;
  subject 4/101 rejected, 5/100 pass; description 19/2001 rejected, 20/2000 pass.
- 400 responses are `application/json`, a JSON array of strings. Unknown extra JSON fields are ignored (planner).
- Order of the validation messages is **not deterministic**: 3 UI empty submits and 3 API all-blank POSTs each gave a
  different order of the same 8 messages (failure-triager 2026-11-07: 3 UI empty submits and 3 API all-blank POSTs,
  6 different orders out of 6; finding MSG-ERR-ORDER).
- Single-field invalid submissions (playwright-test-generator in the browser via Playwright MCP, 2026-11-07, invalid
  submissions only):
  - Blank name with the other four fields valid → exactly 1 message: "Name may not be blank".
  - Blank phone (others valid) → exactly 2: "Phone may not be blank" and "Phone must be between 11 and 21
    characters.".
  - Blank description (others valid) → exactly 2: "Message may not be blank" and "Message must be between 20 and 2000
    characters.".
  - Phone 10 chars, subject 4, message 19 (name and email valid) → exactly the three size messages, no Name or Email
    message.
  - Email `not-an-email` with a blank phone → "must be a well-formed email address", "Phone may not be blank",
    "Phone must be between 11 and 21 characters.".
- `POST /api/message` with a `text/plain` body, malformed JSON or no body → 500 `application/json`
  `{"error":"Failed to create message"}` (planner; triager 2/2; finding MSG-BADBODY-500).
- Anonymous `GET /api/message` → 200 `{ messages: [{ id, name, read, subject }] }`; `GET /api/message/count` → 200
  `{"count":n}`; `GET /api/message/1` → 500, text "Internal Server Error", no content-type (triager 2/2; findings
  MSG-ANON-READ, MSG-ID-500).
- UI form fields: no `maxlength`, no `required`, no placeholder; email `type=email`, phone `type=tel`, name and
  subject `type=text`. Labels `for` = `name`, `email`, `phone`, `subject`, `message`; no element has id `message`;
  `getByLabel('Message')` count 0 (planner; triager 2/2; finding A11Y-MSG-LABEL).
- Error alert: `div.alert.alert-danger` in `#contact` with no `role`, `aria-live` or `aria-atomic` on it or on its
  ancestors up to `#contact` (triager 2/2; finding A11Y-ALERT-LIVE). A second empty submit replaces the alert (1 alert,
  8 `<p>`), it is not duplicated. After a later successful (mocked) submit the alert is gone, the form is replaced by
  the thank-you h3 and there is no link or button back to the form (triager 2/2). Page-wide `getByRole('alert')`
  returned 1 element although the contact alert has no role: probably the Next.js route announcer (not verified) —
  scope alert queries to `#contact`.
- axe with the suite config (tags wcag2a, wcag2aa, wcag21a, wcag21aa; include `#contact`):
  `[{ id: 'label', impact: 'critical', nodes: 1 }]` in the initial state and after an empty submit (triager 2/2 each).
- Mocked success: the request is `application/json` with the 5 keys `name`, `email`, `phone`, `subject`,
  `description` (planner).
- `#contact` holds only the form card (h3 'Send Us a Message', `<form>` without accessible name so
  `getByRole('form')` finds nothing, 5 labelled fields, Submit); no branding values (compared with GET /api/branding),
  no images, links or iframes; outer HTML identical across runs. Branding (name, address, contact) is shown elsewhere,
  e.g. `#location` (failure-triager, 2026-11-07 23:06 UTC, 2 fresh contexts, read-only).
- Tests that mock the success state use `homePage.mockContactSuccess()`, which answers POST /api/message with header
  `x-qa-mock: contact-success`; mocked tests assert that header so a mock that stops matching fails instead of
  creating real messages (QA manager, 2026-11-07).

## Known product findings
Tracked in `specs/findings.md`.
