#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

log() { echo -e "[$(date -Iseconds)] $*"; }

safe_rmrf() {
  local target="${1:-}"
  local allow_under="${2:-}"
  [[ -z "$target" || -z "$allow_under" ]] && { log "❌ empty path"; exit 1; }
  local rp_target rp_base
  rp_target=$(readlink -f -- "$target" || echo "")
  rp_base=$(readlink -f -- "$allow_under" || echo "")
  [[ -z "$rp_target" || -z "$rp_base" ]] && { log "❌ resolve path failed"; exit 1; }
  [[ "$rp_target" == "/" || "$rp_target" == "$HOME" || "$rp_target" == "$PWD" ]] && { log "❌ unsafe path: $rp_target"; exit 1; }
  [[ "$rp_target" != "$rp_base"/* && "$rp_target" != "$rp_base" ]] && { log "❌ outside allowlist: $rp_target"; exit 1; }
  rm -rf -- "$rp_target"
}

WORKDIR="$(pwd)"
CACHE_DIR="${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}"
DOWNLOAD_TIMEOUT_MS="${PUPPETEER_DOWNLOAD_TIMEOUT:-600000}"

log "==> Render build wrapper started"
log "Node: $(node -v) | npm: $(npm -v) | Platform: $(uname -a)"
log "Env: NODE_ENV=${NODE_ENV:-} NODE_VERSION=${NODE_VERSION:-}"
log "Puppeteer env: SKIP=${PUPPETEER_SKIP_DOWNLOAD:-} PRODUCT=${PUPPETEER_PRODUCT:-} CACHE_DIR=${CACHE_DIR} TIMEOUT_MS=${DOWNLOAD_TIMEOUT_MS}"

# Prefer Google Cloud Storage mirror to avoid dl.google.com blocks on Render
export PUPPETEER_DOWNLOAD_HOST="${PUPPETEER_DOWNLOAD_HOST:-https://storage.googleapis.com}"
export PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_DOWNLOAD_BASE_URL:-https://storage.googleapis.com}"
log "PUPPETEER_DOWNLOAD_HOST=${PUPPETEER_DOWNLOAD_HOST} | PUPPETEER_DOWNLOAD_BASE_URL=${PUPPETEER_DOWNLOAD_BASE_URL}"

# Quick network probe for mirrors (status + timing)
probe_host() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    log "Probing ${url}"
    curl -I -L --max-time 10 -sS -w "HTTP %{http_code} | time_connect=%{time_connect}s | time_starttransfer=%{time_starttransfer}s | time_total=%{time_total}s\n" "$url" -o /dev/null || true
  else
    log "curl not available to probe ${url}"
  fi
}
probe_host "https://dl.google.com"
probe_host "https://storage.googleapis.com"

log "[1/4] Preparing cache directory at ${CACHE_DIR}"
mkdir -p -- "$CACHE_DIR"

log "[2/4] Cleaning existing dependencies and lock files (if any)"
if [[ -d "$WORKDIR/node_modules" ]]; then
  safe_rmrf "$WORKDIR/node_modules" "$WORKDIR"
  log "Removed node_modules"
else
  log "No node_modules to remove"
fi
for lf in package-lock.json pnpm-lock.yaml yarn.lock; do
  if [[ -f "$WORKDIR/$lf" ]]; then
    rm -f -- "$WORKDIR/$lf"
    log "Removed $lf"
  fi
done

log "[3/4] Installing production dependencies"
log "$ npm install --omit=dev --no-audit --no-fund"
if ! npm install --omit=dev --no-audit --no-fund; then
  log "❌ npm install failed"; exit 1;
fi
log "✅ npm install completed"

log "Checking Puppeteer version after install"
PUPPETEER_VERSION=$(node -p "require('puppeteer/package.json').version" 2>/dev/null || echo "not-installed")
log "Puppeteer version: ${PUPPETEER_VERSION}"
NODE_VER=$(node -p "process.versions.node")
log "Compatibility: Node ${NODE_VER} vs Puppeteer ${PUPPETEER_VERSION} (expect >=16.3 support)"

log "[4/4] Skipping Chrome download during build (moved to start phase)"
log "Reason: avoid build hangs; start script will install with verbose logs"
log "==> Build finished successfully"
