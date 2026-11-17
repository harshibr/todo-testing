#!/usr/bin/env bash
# Wait until the hosted site (Vercel) and API (Render) are running the commit that was just pushed.
#   wait-deploy.sh <site-url> <api-url> <sha>        needs GH_TOKEN and GITHUB_REPOSITORY
SITE="$1"; API="${2:-}"; SHA="$3"
fail() { echo "::error::$*"; exit 1; }

# 1. API (Render): /api/health reports the commit it runs. The free plan sleeps, so the first call can take ~1 minute.
if [ -n "$API" ]; then
  echo "Waiting for the API ($API) to run ${SHA:0:7} ..."
  for i in $(seq 1 60); do
    got="$(curl -s -m 90 "$API/api/health" | sed -n 's/.*"commit":"\([0-9a-f]*\)".*/\1/p')"
    [ "$got" = "$SHA" ] && { echo "API is running ${SHA:0:7}"; break; }
    echo "  [$i] API reports: ${got:-nothing yet}"; sleep 15
    [ "$i" = 60 ] && fail "API did not report commit $SHA within ~15 minutes (is Render auto-deploy on for this branch?)"
  done
fi

# 2. Website (Vercel): Vercel reports its result on the commit as a status named "Vercel" (and sometimes as a GitHub deployment).
echo "Waiting for the website deployment of ${SHA:0:7} ..."
for i in $(seq 1 40); do
  state="$(gh api "repos/$GITHUB_REPOSITORY/commits/$SHA/status" --jq '[.statuses[] | select(.context | startswith("Vercel")) | select(.context | contains("Comments") | not)] | .[0].state // ""' 2>/dev/null)"
  if [ -z "$state" ]; then
    for id in $(gh api "repos/$GITHUB_REPOSITORY/deployments?sha=$SHA" --jq '.[].id' 2>/dev/null); do
      state="$(gh api "repos/$GITHUB_REPOSITORY/deployments/$id/statuses" --jq '.[0].state' 2>/dev/null)"
    done
  fi
  echo "  [$i] website deployment: ${state:-none yet}"
  [ "$state" = success ] && { echo "Website deployment finished"; break; }
  case "$state" in failure|error) fail "Vercel deployment of $SHA failed" ;; esac
  sleep 15
  [ "$i" = 40 ] && fail "no successful website deployment for $SHA within ~10 minutes"
done
# 3. Final check: the site answers.
curl -fsS -m 30 -o /dev/null --retry 5 --retry-delay 5 "$SITE" || fail "$SITE does not answer"
echo "Deploy confirmed."
