#!/usr/bin/env bash
# One-shot setup for the PARTY TALES chat assistant.
# Asks for a Groq API key once, wires it into local .env, and (if Railway CLI is
# available) pushes it to production and redeploys.
#
#   Get a free key at https://console.groq.com  ->  API Keys  ->  Create.
#
# Usage:  bash setup-ai.sh
set -euo pipefail

cd "$(dirname "$0")"
ENV_FILE=".env"

echo "== PARTY TALES · AI assistant setup =="
echo "Create a free key at https://console.groq.com (API Keys -> Create)."
echo

# --- read the key without echoing it to the screen or shell history ---
read -rsp "Paste your Groq API key (gsk_...): " KEY
echo
if [[ -z "${KEY}" ]]; then
  echo "No key entered. Aborting." >&2
  exit 1
fi
if [[ "${KEY}" != gsk_* ]]; then
  echo "Warning: a Groq key usually starts with 'gsk_'. Continuing anyway."
fi

# --- 1. local .env: create from example if missing, then set/replace the key ---
if [[ ! -f "${ENV_FILE}" && -f ".env.example" ]]; then
  cp .env.example "${ENV_FILE}"
  echo "Created ${ENV_FILE} from .env.example."
fi
touch "${ENV_FILE}"

if grep -q '^AI_API_KEY=' "${ENV_FILE}"; then
  # replace existing line (portable: rewrite the file)
  tmp="$(mktemp)"
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" == AI_API_KEY=* ]]; then
      printf 'AI_API_KEY=%s\n' "${KEY}"
    else
      printf '%s\n' "${line}"
    fi
  done < "${ENV_FILE}" > "${tmp}"
  mv "${tmp}" "${ENV_FILE}"
else
  printf 'AI_API_KEY=%s\n' "${KEY}" >> "${ENV_FILE}"
fi
# Make sure the assistant is enabled.
grep -q '^AI_ENABLED=' "${ENV_FILE}" || printf 'AI_ENABLED=1\n' >> "${ENV_FILE}"
echo "✓ Wrote AI_API_KEY to ${ENV_FILE} (local testing is ready)."

# --- 2. production on Railway, if the CLI is set up ---
if command -v railway >/dev/null 2>&1; then
  if railway status >/dev/null 2>&1; then
    echo "Railway project linked — pushing the key to production..."
    railway variables --set "AI_API_KEY=${KEY}" --set "AI_ENABLED=1"
    echo "Triggering a redeploy..."
    railway redeploy -y >/dev/null 2>&1 || railway up --detach >/dev/null 2>&1 || true
    echo "✓ Production updated. The assistant will answer once the deploy finishes."
  else
    echo
    echo "Railway CLI is installed but no project is linked here."
    echo "Run once:   railway login && railway link"
    echo "then re-run this script, OR set it manually:"
    echo "            railway variables --set \"AI_API_KEY=${KEY}\""
  fi
else
  echo
  echo "Railway CLI not found — local .env is done."
  echo "For production, either:"
  echo "  · Railway dashboard -> your service -> Variables -> add AI_API_KEY, or"
  echo "  · install the CLI:  npm i -g @railway/cli && railway login && railway link"
  echo "    then re-run this script."
fi

echo
echo "Done. 🎈"
