---
name: triage-ci
description: Triage a red run (local test-results or a downloaded CI artifact) with the failure-triager agent, then hand test defects to the healer.
argument-hint: "[path to test-results or allure-results; defaults to ./test-results]"
disable-model-invocation: true
---

Use the `failure-triager` agent on: $ARGUMENTS
(if that is empty, use `./test-results` from the last local run).

When it finishes, show me the classification table. For rows classified as **test defect**, ask before handing
them to the Playwright healer agent. Product defects go to `specs/coverage.md` → Product findings.
