#!/usr/bin/env bash
# Verification for @mind-elixir/import-markdown.
#
#   1. strict type check of the sources
#   2. regression baseline  — what this author BELIEVED the plugins did
#   3. parityvs the originals — what they ACTUALLY did (reads the two plugin
#      repos on disk and runs their extracted code side by side)
#
# Step 3 needs the sibling repos; it is skipped with a notice if they are
# absent, since a checkout of this monorepo alone is a valid state.
#
# Usage: scripts/verify.sh
set -euo pipefail

PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORIGINALS="${ORIGINALS_REPO:-/Users/darksouls/projects/mindmap-plugin}"
cd "$PKG"

echo "package: $PKG"

# --- type check ------------------------------------------------------------
echo
echo "=== type check (strict) ==="
pnpm run --silent check-types
echo "no type errors"

# --- regression baseline ---------------------------------------------------
echo
echo "=== regression baseline ==="
pnpm run --silent test

# --- parity vs originals ---------------------------------------------------
echo
echo "=== parity vs original implementations ==="
if [ -f "$ORIGINALS/mark-elixir/src/core.ts" ] &&
   [ -f "$ORIGINALS/obsidian-mindmap/src/parser.ts" ]; then
  pnpm run --silent test:parity
else
  echo "skipped: originals not found under $ORIGINALS"
  echo "         set ORIGINALS_REPO=<path> to run the parity comparison"
fi

echo
echo "verification complete"
