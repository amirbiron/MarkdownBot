#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

log() { echo -e "[$(date -Iseconds)] $*"; }

log "==> Render start wrapper"
log "Node: $(node -v) | npm: $(npm -v)"
log "Env: NODE_ENV=${NODE_ENV:-}"

# Ensure cache dir and env are configured for runtime install
CACHE_DIR="${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}"
mkdir -p -- "$CACHE_DIR"
export PUPPETEER_CACHE_DIR="$CACHE_DIR"
export PUPPETEER_PRODUCT="chrome"
# Prefer Google Cloud Storage mirror to avoid dl.google.com blocks on Render
export PUPPETEER_DOWNLOAD_HOST="${PUPPETEER_DOWNLOAD_HOST:-https://storage.googleapis.com}"
export PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_DOWNLOAD_BASE_URL:-https://storage.googleapis.com}"
export PUPPETEER_DOWNLOAD_TIMEOUT="${PUPPETEER_DOWNLOAD_TIMEOUT:-600000}"

# Override skip flags that may come from .npmrc or env
unset PUPPETEER_SKIP_DOWNLOAD || true
export PUPPETEER_SKIP_DOWNLOAD=false
export npm_config_puppeteer_skip_download=false

# Quick network probe
if command -v curl >/dev/null 2>&1; then
  log "Probing dl.google.com and storage.googleapis.com"
  curl -I -L --max-time 10 -sS -w "dl.google.com => HTTP %{http_code} | total=%{time_total}s\n" https://dl.google.com -o /dev/null || true
  curl -I -L --max-time 10 -sS -w "storage.googleapis.com => HTTP %{http_code} | total=%{time_total}s\n" https://storage.googleapis.com -o /dev/null || true
fi

# Install Chrome at runtime with verbose logs and timeout guard
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_PREFIX=(timeout 600s)
else
  TIMEOUT_PREFIX=()
fi

LOG_FILE="/tmp/puppeteer-install-$(date +%s).log"
log "Installing Chrome via Puppeteer CLI (logs: $LOG_FILE)"
set +e
{"${TIMEOUT_PREFIX[@]}" npx puppeteer browsers install chrome --verbose; } 2>&1 | tee -a "$LOG_FILE"
RC=${PIPESTATUS[0]:-0}
set -e

if [[ $RC -ne 0 ]]; then
  log "First attempt failed (rc=$RC). Retrying with dl.google.com host"
  export PUPPETEER_DOWNLOAD_HOST="https://dl.google.com"
  set +e
  {"${TIMEOUT_PREFIX[@]}" npx puppeteer browsers install chrome --verbose; } 2>&1 | tee -a "$LOG_FILE"
  RC=${PIPESTATUS[0]:-0}
  set -e
fi

if [[ $RC -ne 0 ]]; then
  log "❌ Failed to install Chrome via Puppeteer CLI (rc=$RC)"
else
  log "✅ Chrome installed into cache at $CACHE_DIR"
fi

# Print Puppeteer info if available
node - <<'JS'
(async () => {
  try {
    const os = require('os');
    console.log(`[start] Platform: ${os.platform()} ${os.arch()}`);
    const pkg = require('puppeteer/package.json');
    console.log(`[start] Puppeteer version: ${pkg.version}`);
    const p = require('puppeteer');
    const execPath = p.executablePath();
    console.log(`[start] Puppeteer executablePath: ${execPath}`);
  } catch (e) {
    console.log('[start] Puppeteer not available or failed to resolve executablePath:', e && e.message);
  }
})();
JS

log "Launching application: node index.js"
exec node index.js
