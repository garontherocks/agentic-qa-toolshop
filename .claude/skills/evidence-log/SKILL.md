---
name: evidence-log
description: How to record an agent session in evidence/agent-runs/ (template and rules). Use at the end of every planning, generation, healing, review or triage session.
user-invocable: false
---

# Evidence log

Write `evidence/agent-runs/<yyyy-mm-dd>-<area>-<step>.md` from [template.md](template.md). Rules:

- Record what really happened, including what failed, what a human changed and what was rejected.
  This folder is the proof that the suite was built agentically; never embellish or summarise away mistakes.
- Link artefacts by path: plan in `specs/`, test files, review report, trace or run URL.
- Numbers come from a real run (`npx playwright test` output or CI), never estimated.
- Keep the human decisions explicit: who approved, what was edited by hand and why.
