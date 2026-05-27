#!/bin/bash
# Deploy Whomping Wordle to Dokku from your Mac.
# Usage: ./scripts/deploy-to-dokku.sh YOUR_PUBLIC_IP [branch]

set -euo pipefail

SERVER_IP="${1:?Usage: $0 SERVER_IP [branch]}"
BRANCH="${2:-feature-8-bug-fixes}"
APP_NAME="whomping-wordle"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT"

if ! git remote | grep -q '^dokku$'; then
  git remote add dokku "dokku@${SERVER_IP}:${APP_NAME}"
else
  git remote set-url dokku "dokku@${SERVER_IP}:${APP_NAME}"
fi

echo "==> Deploying ${BRANCH} to dokku@${SERVER_IP}:${APP_NAME}"
git push dokku "${BRANCH}:main"

echo "==> Done. Open http://${SERVER_IP} or https://whompingwordle.com after DNS is set."
echo "    Logs: ssh dokku@${SERVER_IP} logs ${APP_NAME} --tail"
