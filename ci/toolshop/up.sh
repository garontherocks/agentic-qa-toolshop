#!/usr/bin/env bash
# Starts Toolshop from ci/toolshop/compose.yml, seeds a fresh database and waits until UI and API answer.
# Usage: bash ci/toolshop/up.sh        (CI and local; needs Docker with the compose plugin)
set -euo pipefail

compose=(docker compose -f "$(dirname "$0")/compose.yml")
ui="${TOOLSHOP_URL:-http://localhost:4200}"
api="${TOOLSHOP_API_URL:-http://localhost:8091}"

diagnose() {
  echo "::group::Toolshop diagnostics"
  "${compose[@]}" ps -a || true
  curl -sS -i --max-time 10 "$api/products" | head -40 || true
  curl -sS -i --max-time 10 "$ui" | head -20 || true
  "${compose[@]}" logs --no-color --tail 80 || true
  echo "::endgroup::"
}

wait_for() { # <description> <seconds> <command...>
  local what="$1" limit="$2"; shift 2
  local start=$SECONDS
  until "$@" >/dev/null 2>&1; do
    if (( SECONDS - start > limit )); then echo "::error::Timed out after ${limit}s waiting for $what"; diagnose; return 1; fi
    sleep 3
  done
  echo "$what ready after $(( SECONDS - start ))s"
}

"${compose[@]}" up -d --quiet-pull

wait_for "MariaDB" 180 "${compose[@]}" exec -T mariadb mysqladmin ping -uroot -proot --silent
# A fresh schema and Toolshop's own seed: demo accounts, categories, brands and products.
wait_for "database seed" 180 "${compose[@]}" exec -T laravel-api php artisan migrate:fresh --seed --force
wait_for "API ($api/products)" 120 curl -fsS "$api/products"
# The Angular dev server compiles on start; it serves index.html once the first build is done.
wait_for "UI ($ui)" 600 bash -c "curl -fsS '$ui' | grep -q '<app-root'"
