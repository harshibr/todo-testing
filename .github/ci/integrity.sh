#!/usr/bin/env bash
# Guards the quality of what Claude changed (compares the working tree with HEAD):
#  1. new behaviour must come with tests (source changed => a test file changed too)
#  2. existing tests may be added to, never deleted, skipped or weakened
#  3. new/changed tests must really check something: no tautologies, no test without an assertion, no swallowed errors,
#     no fixed sleeps, no file whose only assertions are "something exists". A deliberate exception: put  // aidev:allow  on that line.
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
# 3 quality of the tests themselves (only what this change adds or modifies)
new_test_files=$( { git diff --name-only --diff-filter=AM "$BASE"; git ls-files --others --exclude-standard; } | sort -u | grep -E "$TESTRE" | grep -vE '(^|/)(helpers/fixtures\.js|playwright\.config\.js|package(-lock)?\.json)$' || true)
q_bad=0
if [ -n "$new_test_files" ]; then
  qlines=$( { for f in $new_test_files; do
      if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then git diff "$BASE" -U0 -- "$f" | grep -E '^\+[^+]' | sed 's/^+//'
      else cat "$f"; fi
    done; } 2>/dev/null | grep -v 'aidev:allow' || true )
  chk() { # description, regex
    local hits; hits=$(printf '%s\n' "$qlines" | grep -nE "$2" || true)
    if [ -n "$hits" ]; then warn "$1"; echo "$hits" | head -5 | sed 's/^/   /' >&2; q_bad=1; fi
  }
  chk "tautology assertion (always true, proves nothing)" 'expect\((true|1)\)\.(toBe|toEqual|toStrictEqual)\((true|1)\)|expect\(true\)\.toBeTruthy\(\)|assert (True|1)$|assert\(true\)|assert\.ok\(true\)'
  chk "empty catch / swallowed error in a test (hides failures)" 'catch *(\([^)]*\))? *\{ *\}|\.catch\(\(\) *=> *(\{ *\})?\)'
  chk "fixed sleep (waitForTimeout / sleep): wait for a condition instead" 'waitForTimeout\(|time\.sleep\(|(^|[^a-zA-Z])sleep\([0-9]'
  # (a condition on process.env is an intentional per-environment check and is allowed)
  qlines_cond=$(printf '%s\n' "$qlines" | grep -v 'process\.env' || true)
  hits=$(printf '%s\n' "$qlines_cond" | grep -nE '(^|[;{])[[:space:]]*if *\(.*\) *\{? *expect\(' || true)
  if [ -n "$hits" ]; then warn "conditional assertion (if (...) expect): the check may silently never run"; echo "$hits" | head -5 | sed 's/^/   /' >&2; q_bad=1; fi
  for f in $new_test_files; do
    [ -f "$f" ] || continue
    total=$(grep -cE "$asserts" "$f" || true)
    weak=$(grep -cE 'toBeDefined\(\)|not\.toBeNull\(\)|not\.toBeUndefined\(\)' "$f" || true)
    if [ "${total:-0}" -gt 0 ] && [ "${weak:-0}" -eq "${total:-0}" ]; then
      warn "$f: every assertion only checks that something exists: assert the actual value or text"; q_bad=1
    fi
    case "$f" in *.js|*.ts|*.jsx|*.tsx|*.mjs)
      tn=$(grep -cE '^[[:space:]]*(test|it)(\.[a-z]+)?\(' "$f" || true)
      if [ "${tn:-0}" -gt "${total:-0}" ]; then warn "$f: $tn tests but only ${total:-0} assertions: some test checks nothing"; q_bad=1; fi ;;
    esac
  done
fi
[ "$q_bad" = 1 ] && { warn "Test quality: make the tests really prove the behaviour. Never silence the check."; bad=1; }
# 1 tests required
if [ -n "$src_changed" ] && [ -z "$tests_changed" ] && [ "${AIDEV_ALLOW_NO_TESTS:-0}" != 1 ]; then
  warn "Code changed but NO test was added or changed. Add test cases for the new behaviour:"
  echo "$src_changed" | sed 's/^/   /' >&2
  bad=1
fi
[ "$bad" = 0 ] && ok "TEST INTEGRITY PASSED" || die "TEST INTEGRITY FAILED"
