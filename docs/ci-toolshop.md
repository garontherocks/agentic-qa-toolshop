# Toolshop in CI

## Why

The hosted Toolshop (practicesoftwaretesting.com) is behind Cloudflare, which answers requests from GitHub-hosted
runners with a challenge page (307 → 403, `cf-mitigated: challenge`). Every browser test failed in CI while the
same tests passed from a home connection (triage: `evidence/agent-runs/`). So CI no longer touches the hosted site:
each suite job starts its own private Toolshop and tests that.

## How

- `ci/toolshop/compose.yml` starts Sprint 5 from Testsmith's published Docker images (API, Angular UI, nginx,
  MariaDB, plus a mail catcher). It mirrors Testsmith's `docker-compose.prod.yml`; no Toolshop code or image is
  copied into this repo.
- `ci/toolshop/up.sh` starts it, runs `php artisan migrate:fresh --seed` and waits until the API and the UI answer.
  Every job gets a fresh database with Toolshop's own seed, so demo accounts and catalogue are always in their
  initial state and nothing is shared with other people.
- Playwright runs in the official image on the host network: UI `http://localhost:4200`, API `http://localhost:8091`.

The images are pulled by tag (`latest`), as Testsmith's own compose does. If a new image changes the app, the
suite will show it like any product change: triage it, don't hide it.

## Locally

```bash
bash ci/toolshop/up.sh
TOOLSHOP_URL=http://localhost:4200 TOOLSHOP_API_URL=http://localhost:8091 npm test
docker compose -f ci/toolshop/compose.yml down -v
```

Without those variables the suite and the agents keep using the hosted site, which works from a home connection.

## Visual baselines

Baselines are taken against the CI Toolshop (Linux, Playwright image). After a change to the images or the UI,
regenerate them with the workflow's `update_snapshots` input on a branch; never commit local screenshots.

## Licence

Toolshop is © Testsmith, all rights reserved. Its licence allows running it for private, internal and
non-commercial purposes. This repo is a personal, non-commercial portfolio project: it runs Toolshop only inside
throwaway CI jobs, never hosts or publishes a copy, does not redistribute its code or images and offers no service
to third parties. If Testsmith asks for this to change, it will.
