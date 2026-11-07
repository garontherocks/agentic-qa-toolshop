# agentic-qa-toolshop

[![Agentic QA Suite](https://github.com/garontherocks/agentic-qa-toolshop/actions/workflows/ci.yml/badge.svg)](https://github.com/garontherocks/agentic-qa-toolshop/actions/workflows/ci.yml)

An agentic QA suite for [Toolshop](https://practicesoftwaretesting.com), a public practice shop with a UI and a
REST API. Tests are **planned, generated, healed and reviewed by Claude Code agents over Playwright MCP**, with a
person approving every step, and run in CI on every push.

- **Live replay of the latest run:** [victoraller.vercel.app/quality-run](https://victoraller.vercel.app/quality-run)
- **Allure report:** [garontherocks.github.io/agentic-qa-toolshop](https://garontherocks.github.io/agentic-qa-toolshop/)
- **How the suite was built:** [`evidence/agent-runs/`](evidence/agent-runs) and [`specs/`](specs)

| Suite | Projects | Folder |
|---|---|---|
| Functional E2E | Chromium, Firefox, WebKit (1920×1080) | `tests/e2e` |
| API | REST, Toolshop API | `tests/api` |
| Visual regression | Chromium, Linux baselines | `tests/visual` |
| Accessibility | axe-core, WCAG 2.1 AA | `tests/a11y` |

## The agentic part

- [`CLAUDE.md`](CLAUDE.md) — project rules every agent follows
- [`.claude/agents`](.claude/agents) — Playwright's planner, generator and healer, plus our `qa-manager`,
  `test-reviewer` and `failure-triager`
- [`.claude/skills`](.claude/skills) — shared knowledge (`suite-conventions`, `toolshop-domain`, `flaky-triage`,
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

To run against a local Toolshop in Docker, as CI does, see [docs/ci-toolshop.md](docs/ci-toolshop.md).

To work with the agents, see [docs/runbook.md](docs/runbook.md).

## Notes

- Toolshop is © Testsmith, all rights reserved. CI tests a private, throwaway Toolshop started from Testsmith's
  published Docker images in each job ([docs/ci-toolshop.md](docs/ci-toolshop.md)); agents and local runs use the
  hosted site, whose database is shared, so the suite uses synthetic data and keeps load low. The demo accounts it
  uses are published in Toolshop's own README.
- The run feed published to Pages follows the `sdet-portfolio/run-feed@1` contract from
  [sdet-portfolio](https://github.com/garontherocks/sdet-portfolio/blob/main/docs/run-feed.md).

MIT © Víctor Martín Aller
