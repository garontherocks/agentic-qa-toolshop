---
name: plan-area
description: Ask the Playwright planner for a test plan of one area of the app under test, saved to specs/<area>.md, without generating tests.
argument-hint: "<area> [notes about risks or scope]"
disable-model-invocation: true
---

Use the Playwright planner agent with the seed `tests/seed.spec.ts` to explore and plan **$ARGUMENTS**.

- Save the plan to `specs/<area>.md` with numbered scenarios using the ID scheme from `suite-conventions`
  (`TC-`, `API-`, `VR-`, `A11Y-`), each with preconditions, steps and expected results.
- Rank scenarios by risk and mark the `@smoke` candidates.
- Record any newly verified locator or endpoint in the `booker-domain` skill.
- Do not generate tests. Write the evidence log for the planning step.
