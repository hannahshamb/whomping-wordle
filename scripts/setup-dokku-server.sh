#!/bin/bash
# Run as root on a fresh Ubuntu 22.04 VPS.
# Usage: bash setup-dokku-server.sh whompingwordle.com

set -euo pipefail

HOSTNAME="${1:-whompingwordle.com}"
APP_NAME="whomping-wordle"
DB_NAME="whomping_wordle"

echo "==> Installing Dokku for hostname: $HOSTNAME"
curl -fsSL https://raw.githubusercontent.com/dokku/dokku/v0.35.5/bootstrap.sh | DOKKU_HOSTNAME="$HOSTNAME" bash

echo "==> Creating app: $APP_NAME"
dokku apps:create "$APP_NAME"

echo "==> Setting domains"
dokku domains:set "$APP_NAME" "$HOSTNAME" "www.$HOSTNAME"

echo "==> Creating Postgres"
dokku postgres:create "$DB_NAME"
dokku postgres:link "$DB_NAME" "$APP_NAME"

echo ""
echo "Done with server setup."
echo ""
echo "Next steps on your Mac:"
echo "  1. dokku config:set $APP_NAME NODE_ENV=production TOKEN_SECRET=\$(openssl rand -hex 32)"
echo "  2. git remote add dokku dokku@YOUR_SERVER_IP:$APP_NAME"
echo "  3. git push dokku main:main"
echo "  4. Update Namecheap A record @ -> YOUR_SERVER_IP"
echo "  5. dokku letsencrypt:set $APP_NAME email you@example.com && dokku letsencrypt:enable $APP_NAME"
