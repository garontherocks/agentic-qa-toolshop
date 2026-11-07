# Test plans

One Markdown plan per area, written by the Playwright **planner** agent from the seed test and approved by a
human before any test is generated. The **generator** turns each numbered scenario into a test with the same ID.

| ID prefix | Suite | Folder |
|---|---|---|
| `TC-` | Functional E2E (Chromium, Firefox, WebKit) | `tests/e2e` |
| `API-` | REST API | `tests/api` |
| `VR-` | Visual regression | `tests/visual` |
| `A11Y-` | Accessibility (axe, WCAG 2.1 AA) | `tests/a11y` |

Coverage across areas and open product findings live in [coverage.md](coverage.md).
