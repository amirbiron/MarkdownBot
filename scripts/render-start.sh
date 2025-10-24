#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

log() { echo -e "[$(date -Iseconds)] $*"; }

log "==> Render start wrapper"
log "Node: $(node -v) | npm: $(npm -v)"
log "Env: NODE_ENV=${NODE_ENV:-}"

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
