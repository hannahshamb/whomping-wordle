#!/bin/bash
# Oracle Cloud Ubuntu 22.04 — run via: bash setup-dokku-oracle.sh whompingwordle.com
# Uses sudo (Oracle default user is ubuntu, not root).

set -euo pipefail

HOSTNAME="${1:-whompingwordle.com}"
APP_NAME="whomping-wordle"
DB_NAME="whomping_wordle"
DOKKU_VERSION="v0.35.5"

echo "==> Opening HTTP/HTTPS in host firewall (Oracle Ubuntu blocks 80/443 by default)"
if ! sudo iptables -C INPUT -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 5 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 443 -j ACCEPT
  if command -v netfilter-persistent >/dev/null; then
    sudo netfilter-persistent save
  fi
fi

echo "==> Ensuring swap (helps E2.1.Micro 1 GB builds)"
if [ "$(swapon --show | wc -l)" -lt 1 ] && [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "==> Installing Dokku ${DOKKU_VERSION} for hostname: ${HOSTNAME}"
if ! command -v dokku >/dev/null 2>&1; then
  curl -fsSL "https://raw.githubusercontent.com/dokku/dokku/${DOKKU_VERSION}/bootstrap.sh" | \
    sudo DOKKU_HOSTNAME="${HOSTNAME}" bash
fi

echo "==> Installing Dokku plugins"
if ! sudo dokku plugin:installed postgres 2>/dev/null | grep -q postgres; then
  sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
fi
if ! sudo dokku plugin:installed letsencrypt 2>/dev/null | grep -q letsencrypt; then
  sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
fi

echo "==> Import SSH key for dokku deploys"
if [ -f "${HOME}/.ssh/authorized_keys" ]; then
  sudo dokku ssh-keys:add admin "${HOME}/.ssh/authorized_keys" 2>/dev/null || true
fi

echo "==> Creating app: ${APP_NAME}"
sudo dokku apps:create "${APP_NAME}" 2>/dev/null || true

echo "==> Setting domains"
sudo dokku domains:set "${APP_NAME}" "${HOSTNAME}" "www.${HOSTNAME}"

echo "==> Creating Postgres"
if ! sudo dokku postgres:exists "${DB_NAME}" 2>/dev/null; then
  sudo dokku postgres:create "${DB_NAME}"
fi
sudo dokku postgres:link "${DB_NAME}" "${APP_NAME}" 2>/dev/null || true

echo ""
echo "==> Server setup complete."
echo ""
echo "Next on your Mac:"
echo "  git remote add dokku dokku@${HOSTNAME}:${APP_NAME}"
echo "  git push dokku feature-8-bug-fixes:main"
echo ""
echo "Before push, set secrets on this server:"
echo "  sudo dokku config:set ${APP_NAME} NODE_ENV=production TOKEN_SECRET=\$(openssl rand -hex 32)"
echo ""
echo "After Namecheap DNS points here, enable HTTPS:"
echo "  sudo dokku letsencrypt:set ${APP_NAME} email you@example.com"
echo "  sudo dokku letsencrypt:enable ${APP_NAME}"
