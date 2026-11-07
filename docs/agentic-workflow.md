# The agentic workflow

```
          ┌──────────── human approves ────────────┐            ┌── human approves ──┐
 /qa-loop │                                        ▼            │                    ▼
 area ──► qa-manager ──► planner ──► specs/<area>.md ──► generator ──► tests/** ──► run ──► healer ──► test-reviewer ──► commit
              │             (Playwright MCP explores the app)                    │   (red)      │ evidence/reviews
              └── keeps specs/coverage.md and evidence/agent-runs/ up to date ◄──┴──────────────┘
```

| Agent | Source | Job | Can edit |
|---|---|---|---|
| `qa-manager` | ours | Orchestrates the loop for one area, ranks gaps by risk, updates coverage | `specs/coverage.md`, `evidence/` |
| planner | Playwright (`init-agents`) | Explores the app from the seed test and writes a Markdown plan | `specs/` |
| generator | Playwright (`init-agents`) | Turns plan scenarios into tests, checking locators live | `tests/`, `src/pages` |
| healer | Playwright (`init-agents`) | Replays a failing test, patches it or marks `fixme` with a reason | `tests/`, `src/pages` |
| `test-reviewer` | ours | Read-only review against conventions and the plan | `evidence/reviews/` |
| `failure-triager` | ours | Classifies red runs: test defect, product defect, environment, flaky | nothing |

**Skills** carry the knowledge every agent shares: `suite-conventions` (how tests are written),
`booker-domain` (verified facts about the app), `flaky-triage`, `evidence-log`. **Commands** (`/qa-loop`,
`/plan-area`, `/review-tests`, `/triage-ci`) are the entry points a human uses.

**Guardrails**: project permissions allow running tests and reading git freely, ask before commits, pushes and
baseline updates, and deny edits to the seed test and reads of `.env`. A `PostToolUse` hook typechecks after
every edit under `tests/` or `src/` and sends errors straight back to the agent.

**Why humans stay in the loop**: the agents are fast at exploring and writing, but the plan decides what
matters, and only a person can accept that a failing test is a product defect. Every decision is in
`evidence/agent-runs/`.

## Recommended general-purpose skills

The project enables [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) as a plugin. They complement
the suite's own skills; when they overlap, the suite's conventions win.

- `grill-me` before planning a risky area, to settle scope and edge cases.
- `diagnosing-bugs` alongside `failure-triager` for hard failures.
- `code-review` for framework code in `src/` (tests go through `test-reviewer`).
- `writing-for-agents` when editing this file, `CLAUDE.md` or a skill.
- `handoff` to pass a long session to a fresh one.
