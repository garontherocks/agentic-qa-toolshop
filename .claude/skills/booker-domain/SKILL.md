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
- Not yet verified: what `/admin` shows after a UI login (the probe's headless check still saw the login form right
  after the click; it may need to wait for navigation), and the `/reservation/{id}` page (rendered empty during the
  probe's network-idle snapshot; it loads client-side).

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
- `GET /api/message` → 200 `{ messages: [{ id, name, subject, read }] }` **without a token too** (candidate finding:
  message senders and subjects are readable anonymously; confirm in the UI and the source before filing).
- `POST /api/booking` (public) `{ roomid, firstname, lastname, depositpaid, email, phone, bookingdates{checkin,checkout} }`
  → 201 with `bookingid`. Validation 400 `{ errors: [...] }`: firstname 3–18 ("size must be between 3 and 18"),
  lastname 3–30 ("size must be between 3 and 30"), "Lastname should not be blank".
- `GET /api/booking?roomid=` → 401 `{"error":"Authentication required"}` anonymously, 200 `{ bookings: [...] }` as admin.
  `GET /api/booking/summary?roomid=` → 401 anonymously.
- `DELETE /api/booking/{id}` as admin → **500** (probe 2026-11-07): bookings can't be cleaned up on the hosted demo.
- `GET /api/report/room/1` → 500 (probe 2026-11-07).

## Known product findings
Tracked in `specs/findings.md`.
