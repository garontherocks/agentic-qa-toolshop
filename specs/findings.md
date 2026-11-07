# Product findings

Behaviour of the app under test that the agents found to be wrong. Each one has a `test.fixme()` that asserts the
correct behaviour, so it starts failing the moment the app is fixed. These tests are skipped in CI and are not part
of the published replay; the Quality run page links here instead.

| ID | Area | What is wrong | Evidence | Test |
|---|---|---|---|---|
| MSG-ANON-READ | Contact form | Anonymous `GET /api/message` returns 200 with senders' names and subjects, and `GET /api/message/count` returns 200; expected 401. | failure-triager 2026-11-07 22:37–22:38 UTC, 2/2 (fresh contexts, invalid/read-only requests); plan specs/contact-form.md | API-12, `tests/api/contact-message.spec.ts` (fixme) |
| MSG-ID-500 | Contact form | Anonymous `GET /api/message/1` returns 500 "Internal Server Error" instead of 401. | failure-triager 2026-11-07 22:37–22:38 UTC, 2/2 (fresh contexts, invalid/read-only requests); plan specs/contact-form.md | API-14, `tests/api/contact-message.spec.ts` (fixme) |
| MSG-BADBODY-500 | Contact form | `POST /api/message` with a non-JSON, malformed or empty body returns 500 `{"error":"Failed to create message"}` instead of a 4xx. | failure-triager 2026-11-07 22:37–22:38 UTC, 2/2 (fresh contexts, invalid/read-only requests); plan specs/contact-form.md | API-11, `tests/api/contact-message.spec.ts` (fixme) |
| MSG-ERR-ORDER | Contact form | Validation messages come back in a different order on every request (6/6 different orders, same 8 messages). | failure-triager 2026-11-07 22:37–22:38 UTC, 2/2 (fresh contexts, invalid/read-only requests); plan specs/contact-form.md | VR-02, `tests/visual/contact-form.spec.ts` (fixme); TC-03 asserts membership only |
| A11Y-MSG-LABEL | Contact form | Label "Message" is `for="message"` but the textarea is `id="description"`: the field has no accessible label (axe `label`, critical, 1 node). | failure-triager 2026-11-07 22:37–22:38 UTC, 2/2 (fresh contexts, invalid/read-only requests); plan specs/contact-form.md | A11Y-01 and A11Y-03 assert the exact known violation list with a `finding` annotation (not fixme); A11Y-04 (fixme, targeted label association); `tests/a11y/contact-form.spec.ts` |
| A11Y-ALERT-LIVE | Contact form | The contact error alert has no `role="alert"` / `aria-live`, so screen readers are not told about validation errors. | failure-triager 2026-11-07 22:37–22:38 UTC, 2/2 (fresh contexts, invalid/read-only requests); plan specs/contact-form.md | A11Y-05, `tests/a11y/contact-form.spec.ts` (fixme) |

Findings from the Toolshop era are in [archive/toolshop-auth.md](archive/toolshop-auth.md).
