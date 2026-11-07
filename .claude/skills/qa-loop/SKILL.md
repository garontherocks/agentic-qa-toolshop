---
name: qa-loop
description: Run the full agentic loop (plan, generate, run, heal, review) for one area of the app under test through the qa-manager agent.
argument-hint: "<area> e.g. checkout, product-search, auth, contact, api-products, visual-forms, a11y-core"
disable-model-invocation: true
---

Use the `qa-manager` agent to cover the area **$ARGUMENTS**.

Current coverage:
!`cat specs/coverage.md 2>/dev/null || echo "(no coverage file yet)"`

Existing plans:
!`ls specs 2>/dev/null || true`

Stop for my approval after the plan and again before anything is committed. Finish with the evidence log.
