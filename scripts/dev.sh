#!/usr/bin/env bash
# Build site/appindex.json from the live appfair org releases and run the
# appland dev server against the *local* ../appland/ checkout, instead of
# fetching the template from GitHub the way the deploy workflow does.
#
# Layout assumed:
#   appfair/
#     appfair.net/    (this repo — script run from here)
#     appland/        (the template, cloned as a sibling)
#
# Usage:
#   scripts/dev.sh

set -euo pipefail

# Run from the repo root so all relative paths resolve consistently.
cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
TEMPLATE_SRC="${REPO_ROOT}/../appland"

if [[ ! -d "${TEMPLATE_SRC}" ]]; then
  echo "dev.sh: expected ../appland/ at ${TEMPLATE_SRC}" >&2
  echo "        clone the template as a sibling of this repo:" >&2
  echo "          git clone https://github.com/appfair/appland ../appland" >&2
  exit 1
fi

# ─── 1. Aggregate the catalog ──────────────────────────────────────────────
# An auth token raises the GitHub API rate limit, but it's optional for
# occasional dev use. `gh auth token` succeeds quietly when the user is
# already signed in to the gh CLI.
if [[ -z "${GITHUB_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
  GITHUB_TOKEN="$(gh auth token 2>/dev/null || true)"
fi
GITHUB_TOKEN="${GITHUB_TOKEN:-}" node scripts/aggregate.mjs

# ─── 2. Mirror ../appland/ into site/appland/ ──────────────────────────────
# A previous run may have created site/appland as a directory or as a
# symlink — either way, normalize it back to a plain directory before we
# write into it. We exclude node_modules so subsequent runs reuse what's
# already installed.
if [[ -L site/appland ]]; then
  rm site/appland
fi
mkdir -p site/appland

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.astro \
    "${TEMPLATE_SRC}/" site/appland/
else
  # Portable fallback for environments without rsync.
  find site/appland -mindepth 1 -maxdepth 1 \
    ! -name node_modules \
    -exec rm -rf {} +
  cp -R "${TEMPLATE_SRC}/." site/appland/
  rm -rf site/appland/dist site/appland/.astro
fi

# ─── 3. Merge site/public/ into the template's public/ ─────────────────────
# Mirrors what .github/workflows/aggregate.yml does in CI, so the same
# extra files (favicon, badges, generated appindex.v1.json, …) ship in
# both contexts.
if [[ -d site/public ]]; then
  mkdir -p site/appland/public
  cp -R site/public/. site/appland/public/
fi

# ─── 4. Install template deps the first time around ────────────────────────
if [[ ! -d site/appland/node_modules ]]; then
  echo "dev.sh: installing template dependencies (one-time)…"
  (cd site/appland && npm install --no-audit --no-fund)
fi

# ─── 5. Launch the dev server ──────────────────────────────────────────────
ASTRO_PORT=${ASTRO_PORT:-4321}
echo "dev.sh: launching astro dev → http://localhost:${ASTRO_PORT}/"
exec npm --prefix site/appland run dev -- --port ${ASTRO_PORT}
