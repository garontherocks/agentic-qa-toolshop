---
name: review-tests
description: Review changed or given tests with the test-reviewer agent and save the report to evidence/reviews/.
argument-hint: "[files or glob; defaults to changes against main]"
disable-model-invocation: true
---

Use the `test-reviewer` agent on: $ARGUMENTS
(if that is empty, review the test and source files changed against main, listed below).

Changed files:
!`git diff --name-only origin/main...HEAD -- tests src 2>/dev/null || git diff --name-only -- tests src`

Show me the verdict and the blocking findings when it finishes.
