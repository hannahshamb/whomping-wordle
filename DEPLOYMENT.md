# Deploy Whomping Wordle to whompingwordle.com

This guide relaunches the app on a **new Dokku server** and points Namecheap DNS at it.

## Overview

1. Create a VPS (DigitalOcean recommended)
2. Install Dokku on the server
3. Push the app from your laptop
4. Update Namecheap DNS (`@` A record → new server IP)
5. Enable HTTPS

---

## Part 1: Create a server (DigitalOcean)

1. Sign in at [digitalocean.com](https://www.digitalocean.com)
2. **Create → Droplets**
3. Choose:
   - **Ubuntu 22.04 LTS**
   - **Basic** plan, **$6/mo** (1 GB RAM is enough to start)
   - Region closest to you
   - **Authentication:** SSH key (add your Mac key: `cat ~/.ssh/github_rsa.pub`)
4. Create droplet and copy the **public IP** (example: `157.230.xxx.xxx`)

---

## Part 2: Install Dokku (run on the server)

SSH in as root:

```bash
ssh root@YOUR_SERVER_IP
```

Run the setup script from this repo (or paste commands manually):

```bash
curl -fsSL https://raw.githubusercontent.com/dokku/dokku/v0.35.5/bootstrap.sh | DOKKU_HOSTNAME=whompingwordle.com bash
```

When prompted, add your SSH public key (same one you use for GitHub).

Or use the local script:

```bash
scp scripts/setup-dokku-server.sh root@YOUR_SERVER_IP:/root/
ssh root@YOUR_SERVER_IP 'bash /root/setup-dokku-server.sh whompingwordle.com'
```

---

## Part 3: Configure the app (on the server)

Still SSH'd as root:

```bash
# Create app
dokku apps:create whomping-wordle

# Domains (root + www)
dokku domains:set whomping-wordle whompingwordle.com www.whompingwordle.com

# Postgres
dokku postgres:create whomping_wordle
dokku postgres:link whomping_wordle whomping-wordle

# Secrets — use a long random string for TOKEN_SECRET
dokku config:set whomping-wordle \
  NODE_ENV=production \
  TOKEN_SECRET=REPLACE_WITH_LONG_RANDOM_STRING

# HTTPS (after DNS is updated — step 5)
dokku letsencrypt:set whomping-wordle email YOUR_EMAIL@example.com
dokku letsencrypt:enable whomping-wordle
```

---

## Part 4: Deploy from your Mac

```bash
cd /Users/hannahengelhardt/Desktop/TestProject

# Add dokku remote (once)
git remote add dokku dokku@YOUR_SERVER_IP:whomping-wordle

# Deploy (use main or feature branch)
git push dokku feature-8-bug-fixes:main
# or after merging: git push dokku main:main

# Watch logs
ssh dokku@YOUR_SERVER_IP logs whomping-wordle --tail
```

The deploy runs `heroku-postbuild` (webpack) and `release` (schema import) automatically via the Procfile.

---

## Part 5: Update Namecheap DNS

In **Advanced DNS** for whompingwordle.com:

| Type | Host | Value | Action |
|------|------|--------|--------|
| A | `@` | `YOUR_SERVER_IP` | **Edit** — replace `184.169.253.131` |
| A | `www` | `YOUR_SERVER_IP` | **Add** (optional) |
| CNAME | `*` | `whompingwordle.com.` | Keep or remove (optional) |

Remove any **URL Redirect** / parking records elsewhere in Namecheap.

Wait 15–30 minutes, then test:

```bash
dig whompingwordle.com +short
curl -I https://whompingwordle.com
```

Then enable Let's Encrypt (Part 3, last two commands) if you haven't yet.

---

## Troubleshooting

**Build fails on deploy**
```bash
ssh dokku@YOUR_SERVER_IP logs whomping-wordle --tail
```

**Database errors**
```bash
ssh dokku@YOUR_SERVER_IP postgres:connect whomping_wordle
```

**App not loading after DNS change**
- Confirm A record points to new IP, not `184.169.253.131`
- `dokku ps:report whomping-wordle`
- `dokku domains:report whomping-wordle`

**SSL errors**
- DNS must resolve to your server before Let's Encrypt works
- Re-run: `dokku letsencrypt:enable whomping-wordle`

---

## Quick reference

| Item | Value |
|------|--------|
| App name | `whomping-wordle` |
| Canonical URL | `https://whompingwordle.com` |
| Old broken IP | `184.169.253.131` (GoDaddy — remove) |
| Procfile | `release` + `web` |
| Env vars | `DATABASE_URL` (auto), `TOKEN_SECRET`, `NODE_ENV=production` |
