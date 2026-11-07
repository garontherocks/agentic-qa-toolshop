# agentic-qa-toolshop

[![Agentic QA Suite](https://github.com/garontherocks/agentic-qa-toolshop/actions/workflows/ci.yml/badge.svg)](https://github.com/garontherocks/agentic-qa-toolshop/actions/workflows/ci.yml)

An agentic QA suite for the [Restful-booker platform](https://automationintesting.online), a public bed-and-breakfast
booking app built for practising testing, with a UI and a REST API. Tests are **planned, generated, healed and reviewed by Claude Code agents over Playwright MCP**, with a
person approving every step, and run in CI on every push.

- **Live replay of the latest run:** [victoraller.vercel.app/quality-run](https://victoraller.vercel.app/quality-run)
- **Allure report:** [garontherocks.github.io/agentic-qa-toolshop](https://garontherocks.github.io/agentic-qa-toolshop/)
- **How the suite was built:** [`evidence/agent-runs/`](evidence/agent-runs) and [`specs/`](specs)

| Suite | Projects | Folder |
|---|---|---|
| Functional E2E | Chromium, Firefox, WebKit (1920×1080) | `tests/e2e` |
| API | REST, `/api` on the same host | `tests/api` |
| Visual regression | Chromium, Linux baselines | `tests/visual` |
| Accessibility | axe-core, WCAG 2.1 AA | `tests/a11y` |

## The agentic part

- [`CLAUDE.md`](CLAUDE.md) — project rules every agent follows
- [`.claude/agents`](.claude/agents) — Playwright's planner, generator and healer, plus our `qa-manager`,
  `test-reviewer` and `failure-triager`
- [`.claude/skills`](.claude/skills) — shared knowledge (`suite-conventions`, `booker-domain`, `flaky-triage`,
  `evidence-log`) and entry points (`/qa-loop`, `/plan-area`, `/review-tests`, `/triage-ci`)
- [`.claude/settings.json`](.claude/settings.json) — permissions and a typecheck hook after every agent edit
- [`docs/agentic-workflow.md`](docs/agentic-workflow.md) — the loop, who does what, and why humans stay in it

## Run it

```bash
npm install
npx playwright install --with-deps
npm test                 # everything
npm run test:smoke       # seed checks only
```

To work with the agents, see [docs/runbook.md](docs/runbook.md).

## Notes

- The Restful-booker platform is by Mark Winteringham
  ([GPL-3.0](https://github.com/mwinteringham/restful-booker-platform)). The hosted demo is shared, so the suite
  uses synthetic data, stays read-only on data it didn't create and keeps load low. The admin account it uses is
  published in the platform's README.
- Product bugs the agents find are tracked in [`specs/findings.md`](specs/findings.md); their `fixme` tests are not
  part of the published replay.
- Why the name: the suite first targeted Toolshop (practicesoftwaretesting.com) until its Cloudflare challenge
  started blocking GitHub runners. That work is archived in [`specs/archive/`](specs/archive) and
  [`evidence/`](evidence).
- The run feed published to Pages follows the `sdet-portfolio/run-feed@1` contract from
  [sdet-portfolio](https://github.com/garontherocks/sdet-portfolio/blob/main/docs/run-feed.md).

MIT © Víctor Martín Aller
