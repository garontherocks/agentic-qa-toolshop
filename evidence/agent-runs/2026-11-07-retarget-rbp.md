# 2026-11-07 · infrastructure · retarget to the Restful-booker platform

- **Asked**: the owner asked to stop testing a local copy (Toolshop in Docker) and to move the suite to a hosted
  demo that GitHub runners can reach, with only green tests in the published replay.
- **Agents**: none of the suite's agents. Claude (cloud session, outside the repo's agent loop) did the
  infrastructure work below; the owner chose the target and the findings policy.
- **Inputs**: two probes from a GitHub-hosted runner (temporary branches `probe/targets` and `probe/rbp`).

## What was done
- Probed 20 practice sites from a runner: Toolshop still answers with a Cloudflare challenge (403); SauceDemo,
  Reqres, the Restful-booker platform, Conduit and others answer 200. SauceDemo + Reqres were rejected because
  sdet-portfolio already tests them; the owner chose the Restful-booker platform (UI and API of one app).
- Probed the platform's API and UI and recorded the results in the `booker-domain` skill.
- Retargeted config, env, API client, page objects, fixtures and the seed; removed the Toolshop tests and the
  Docker CI. The Toolshop auth plan is archived in `specs/archive/`; its logs and reviews stay in `evidence/`.
- The run feed now lists only tests that ran; skipped `fixme` tests are counted as known issues and linked to
  `specs/findings.md`.

## Side effects on the shared demo
- The probes created one contact message ("Probe from CI") and one booking (room 1, 2027-09-14 → 16, guest
  "Qaagent Probeone"). The booking delete returned 500 and messages return no id, so neither could be removed.

## Result
Run: CI on this PR (seed only: 2 tests).

## Notes for next time
- First areas to run through `/qa-loop`: contact form, booking, admin sign-in. Verify the post-login admin page and
  the reservation page in the browser before planning; the probe could not.
