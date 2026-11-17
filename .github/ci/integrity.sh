#!/usr/bin/env bash
# Guards the quality of what Claude changed (compares the working tree with HEAD):
#  1. new behaviour must come with tests (source changed => a test file changed too)
#  2. existing tests may be added to, never deleted, skipped or weakened
# Override for pure docs/refactor work: AIDEV_ALLOW_NO_TESTS=1
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_project
cd "$CODE_DIR"; bad=0; BASE="${AIDEV_BASE:-HEAD}"
TESTRE='(^|/)(tests?|__tests__|e2e|spec)/|\.(test|spec)\.[jt]sx?$|_test\.(py|go)$|(^|/)test_[^/]*\.py$'
OTHERRE='\.(md|txt)$|^docs/|^\.github/|package-lock\.json$|\.lock$|(^|/)\.gitignore$|^LICENSE'

# A ROLLBACK commit (made by scripts/release.sh rollback) may remove what it undoes, including that change's tests.
# It is accepted ONLY if its files are exactly the files of an earlier commit named in its message, so nothing new can hide in it.
is_rollback() { # commit
  local c="$1" subj prev
  subj="$(git log -1 --format=%s "$c" 2>/dev/null)"
  [[ "$subj" =~ ^Rollback:\ return\ to\ ([0-9a-f]{7,40}) ]] || return 1
  prev="${BASH_REMATCH[1]}"
  git rev-parse --verify -q "$prev^{commit}" >/dev/null || return 1
  git merge-base --is-ancestor "$prev" "$c" || return 1
  [ "$(git rev-parse "$c^{tree}")" = "$(git rev-parse "$prev^{tree}")" ]
}
if git diff --quiet HEAD 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  if is_rollback HEAD || { git rev-parse --verify -q HEAD^2 >/dev/null && is_rollback HEAD^2; }; then
    ok "TEST INTEGRITY PASSED (rollback commit: identical to an earlier verified version, or merges one)"; exit 0
  fi
fi

changed=$( { git diff --name-only "$BASE"; git ls-files --others --exclude-standard; } | sort -u )
[ -n "$changed" ] || { ok "no changes"; exit 0; }
tests_changed=$(echo "$changed" | grep -E "$TESTRE" | grep -vE '(^|/)(helpers/fixtures\.js|playwright\.config\.js|package(-lock)?\.json)$' || true)
src_changed=$(echo "$changed" | grep -vE "$TESTRE" | grep -vE "$OTHERRE" || true)

info "Test integrity"
# 2a deleted tests
deleted=$(git diff --name-status "$BASE" | awk '$1=="D"{print $2}' | grep -E "$TESTRE" || true)
[ -n "$deleted" ] && { warn "test files deleted:"; echo "$deleted" >&2; bad=1; }
# 2b skipped / focused tests
skips='(\.skip\(|\.only\(|\.fixme\(|\bxit\(|\bxdescribe\(|@pytest\.mark\.skip|t\.Skip\()'
added_lines=$( { git diff "$BASE" -U0 -- $(echo "$changed" | grep -E "$TESTRE" | tr '\n' ' ') 2>/dev/null | grep -E '^\+[^+]'; \
  for f in $(git ls-files --others --exclude-standard | grep -E "$TESTRE"); do sed 's/^/+/' "$f"; done; } 2>/dev/null )
echo "$added_lines" | grep -E "$skips" >/dev/null && { warn "a test was skipped or focused (.skip/.only/.fixme)"; echo "$added_lines" | grep -E "$skips" >&2; bad=1; }
# 2c fewer assertions than before
asserts='(expect\(|assert[A-Za-z_.]*\(|assert )'
rm_n=$(git diff "$BASE" -U0 -- $(echo "$changed" | grep -E "$TESTRE" | tr '\n' ' ') 2>/dev/null | grep -E '^-[^-]' | grep -cE "$asserts" || true)
ad_n=$(echo "$added_lines" | grep -cE "$asserts" || true)
[ "${rm_n:-0}" -gt "${ad_n:-0}" ] && { warn "assertions were removed ($rm_n removed, $ad_n added): fix the code, not the test"; bad=1; }
# 1 tests required
if [ -n "$src_changed" ] && [ -z "$tests_changed" ] && [ "${AIDEV_ALLOW_NO_TESTS:-0}" != 1 ]; then
  warn "Code changed but NO test was added or changed. Add test cases for the new behaviour:"
  echo "$src_changed" | sed 's/^/   /' >&2
  bad=1
fi
[ "$bad" = 0 ] && ok "TEST INTEGRITY PASSED" || die "TEST INTEGRITY FAILED"
