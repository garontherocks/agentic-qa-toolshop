# Runbook: working with the agents

Everything below runs on your machine with Claude Code. CI only runs the tests that come out of it.

## One-time setup

1. `npm install` and commit the generated `package-lock.json` (CI uses `npm ci` once it exists).
2. `npx playwright install --with-deps`
3. `npx playwright init-agents --loop=claude`
   Generates the planner, generator and healer under `.claude/agents/` and an `.mcp.json` with Playwright's
   test MCP server. Commit both. It also offers a seed test: keep ours (`tests/seed.spec.ts`).
4. Add the browser MCP for exploration and triage (project scope, so it lands in `.mcp.json` next to the other):
   `claude mcp add --scope project playwright -- npx @playwright/mcp@latest`
5. Start Claude Code in the repo (`claude`), accept the project MCP servers and the `mattpocock-skills`
   plugin when asked. Check with `/mcp` that both servers are connected, and ask Claude to list the project's
   subagents and skills: it should name the three `playwright-test-*` agents plus `qa-manager`,
   `test-reviewer` and `failure-triager`.
6. GitHub: Settings → Pages → Source: **GitHub Actions** (so `main` publishes the Allure report and the feed).

## The loop, per area

Suggested order (by risk): `auth`, `product-search`, `cart-checkout`, `contact`, `api-products`,
`api-users-auth`, `visual-forms`, `a11y-core-pages`.

1. `/qa-loop <area>` — the `qa-manager` asks the planner for `specs/<area>.md` and stops for your approval.
   Read the plan; edit or reject scenarios. (Optional: `grill-me` first for risky areas.)
2. Approve → the generator writes the tests, the manager runs them, the healer fixes red ones, the reviewer writes
   `evidence/reviews/...`. Stop points ask you before anything is committed.
3. Check the session log in `evidence/agent-runs/` says what really happened, then commit on a branch and open a
   PR. CI must be green before merging.
4. Visual baselines (Linux only): Actions → **Agentic QA Suite** → Run workflow → pick your branch → tick
   **update_snapshots**. The run commits the baselines to that branch (never to `main`); review the images in the
   PR, then push any commit to re-run the checks.

## When CI is red

`/triage-ci <path to downloaded allure-results or test-results>` → the triager classifies each failure; you
decide what goes to the healer and what becomes a product finding.
