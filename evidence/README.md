# Evidence

How this suite was built, kept honestly:

- `agent-runs/` — one log per agent session (plan, generate, heal, review, triage), using the template in
  `.claude/skills/evidence-log/template.md`. Includes what failed, what a human edited and what was rejected.
- `reviews/` — reports from the `test-reviewer` agent, one per area or change.

Nothing in these folders is written by hand after the fact to look better than it was.
