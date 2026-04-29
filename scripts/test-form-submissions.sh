#!/usr/bin/env bash
# Smoke-tests the FormSubmit pipeline used by the LP and pitch modals
# (js/lp-modal.js, js/pitch-modal.js). The modals POST JSON to FormSubmit's
# AJAX endpoint; this script does the same so what it tests matches what
# real visitors will trigger.
#
# Use this to:
#   1. Trigger FormSubmit's one-time activation email on first run.
#   2. Verify both modal pipelines continue delivering after activation.
#
# Usage:
#   ./scripts/test-form-submissions.sh           # post to both forms
#   ./scripts/test-form-submissions.sh lp        # only the LP modal
#   ./scripts/test-form-submissions.sh pitch     # only the pitch modal
#
# Override the destination if needed:
#   FORMSUBMIT_EMAIL=someone@example.com ./scripts/test-form-submissions.sh

set -euo pipefail

EMAIL="${FORMSUBMIT_EMAIL:-conchur@mvbventures.com}"
ENDPOINT="https://formsubmit.co/ajax/${EMAIL}"
TARGET="${1:-both}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
dim()  { printf '\033[2m%s\033[0m\n' "$1"; }

post_json() {
  local label="$1" out="$2" body="$3"
  bold "→ ${label} → ${ENDPOINT}"
  status=$(curl -sS -o "${out}" -w '%{http_code}' \
    -X POST "${ENDPOINT}" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json' \
    -e "https://mvbventures.com/" \
    --data "${body}")
  echo "  HTTP ${status}"
  dim  "  Response: $(tr -d '\n' < "${out}" | cut -c1-200)"
  echo
}

post_lp() {
  read -r -d '' body <<'JSON' || true
{
  "_subject": "MVB Ventures — LP / limited partner interest [TEST]",
  "_template": "table",
  "_captcha": "false",
  "full_name": "Test LP (script)",
  "firm": "Acme Family Office",
  "role": "Principal",
  "email": "test-lp@example.com",
  "jurisdiction": "Ireland",
  "investor_type": "Family office",
  "accreditation": "Qualified / Accredited",
  "indicative_ticket": "€1 – €5M",
  "allocation_timeline": "Actively allocating (0–3 mo)",
  "referral": "Sent by scripts/test-form-submissions.sh",
  "notes": "Safe to ignore — automated smoke test."
}
JSON
  post_json "Posting LP modal payload" /tmp/formsubmit-lp.json "$body"
}

post_pitch() {
  read -r -d '' body <<'JSON' || true
{
  "_subject": "MVB Ventures — Pitch to the team (company inbound) [TEST]",
  "_template": "table",
  "_captcha": "false",
  "company": "Test Co (script)",
  "sector": "AI & ML",
  "stage": "Pre-seed",
  "url": "https://example.com",
  "pitch": "Automated smoke-test submission from scripts/test-form-submissions.sh — safe to ignore.",
  "email": "test-founder@example.com"
}
JSON
  post_json "Posting pitch modal payload" /tmp/formsubmit-pitch.json "$body"
}

case "$TARGET" in
  lp)    post_lp ;;
  pitch) post_pitch ;;
  both)  post_lp; post_pitch ;;
  *)     echo "Unknown target: $TARGET (expected: lp | pitch | both)"; exit 1 ;;
esac

bold "Done."
cat <<NOTE

What to check next:
  • A successful response looks like {"success":"true", ...}. If you instead
    see a message about activation, check ${EMAIL} for FormSubmit's one-time
    activation email and click the confirmation link.
  • Re-run this script anytime to smoke-test the modal pipeline.
  • The standalone form pages (invest-in-me-form.html, lps-investors-contact-form.html)
    post to https://formsubmit.co/${EMAIL} (non-AJAX) and continue to work as a
    JS-disabled fallback.
NOTE
