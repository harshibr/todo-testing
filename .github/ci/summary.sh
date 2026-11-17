#!/usr/bin/env bash
# Prints a Markdown summary of one test run (shown on the GitHub run page).  summary.sh <label> <site> <api> <sha> <results.json>
LABEL="$1"; SITE="$2"; API="$3"; SHA="$4"; J="$5"
echo "## Test proof: $LABEL"
echo
echo "| | |"; echo "|---|---|"
echo "| Commit tested | \`$SHA\` |"
echo "| Website | $SITE |"
echo "| API | ${API:-same address as the website} |"
echo "| Time | $(date -u '+%Y-%m-%d %H:%M UTC') |"
if [ -f "$J" ] && command -v jq >/dev/null; then
  echo "| Passed | $(jq '.stats.expected' "$J") |"
  echo "| Failed | $(jq '.stats.unexpected' "$J") |"
  echo "| Skipped | $(jq '.stats.skipped' "$J") |"
  echo; echo "### Tests that ran"; echo
  jq -r '[.. | objects | select(has("specs")) | .specs[]] | .[] | "- \(if .ok then "✅" else "❌" end) \(.title)  (\(.tests[0].projectName))"' "$J"
else echo "| Result | no results file (the tests did not finish) |"; fi
echo; echo "The full report (screenshots, traces of failures) is in this run's Artifacts."
