#!/usr/bin/env bash
# Basic security gate: 1. no secrets in changed/new code  2. .env not tracked  3. dependency audit (high+)
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_project
cd "$CODE_DIR"; bad=0; BASE="${AIDEV_BASE:-HEAD}"

info "Secret scan (changed and new files)"
PATTERN='(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|(password|passwd|secret|api[_-]?key|token)["'"'"' ]*[:=][ ]*["'"'"'][^"'"'"' ]{8,}["'"'"'])'
files=$( { git diff --name-only "$BASE"; git ls-files --others --exclude-standard; } 2>/dev/null | sort -u )
for f in $files; do
  [ -f "$f" ] || continue
  case "$f" in *package-lock.json|*.lock|*.png|*.jpg|*.svg|*.ico|*.woff*) continue ;; esac
  if grep -InE "$PATTERN" "$f" 2>/dev/null | grep -viE 'process\.env|os\.environ|example|placeholder|changeme|\$\{' ; then
    warn "possible secret in $f"; bad=1
  fi
done

info "Tracked env files"
if git ls-files | grep -E '(^|/)\.env($|\.[a-z]+$)' | grep -v '\.example$' | grep -q .; then
  warn "an .env file is tracked by git"; bad=1
fi

info "Dependency audit"
if [ -f package.json ] && [ -f package-lock.json ]; then
  npm audit --audit-level=high --omit=dev >/dev/null 2>&1 && ok "npm audit: no high/critical" \
    || { warn "npm audit found high/critical vulnerabilities (cd workspace/code && npm audit)"; bad=1; }
elif [ -f requirements.txt ] && command -v pip-audit >/dev/null; then
  pip-audit -r requirements.txt >/dev/null 2>&1 && ok "pip-audit clean" || { warn "pip-audit found issues"; bad=1; }
else warn "no dependency audit available for this stack (skipped)"; fi

[ "$bad" = 0 ] && ok "SECURITY CHECK PASSED" || die "SECURITY CHECK FAILED"
