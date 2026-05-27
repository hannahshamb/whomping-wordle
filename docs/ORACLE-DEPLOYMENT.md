# Deploy to Oracle Cloud Always Free + Dokku

Same workflow as LearningFuze bootcamp (Dokku + Postgres + `git push`), but the server is a **free Oracle VM** instead of AWS EC2.

**Cost:** $0/month on Always Free tier (no credit card charges if you stay within free limits).

---

## Phase 1: Oracle Cloud account (one time, ~15 min)

1. Go to [https://cloud.oracle.com](https://cloud.oracle.com) and **Sign Up**.
2. Complete verification (credit card may be required for identity — **Always Free resources should not charge** if you only use free shapes).
3. Sign in → **Oracle Cloud Console**.

---

## Phase 2: Create a free VM (one time, ~10 min)

### 2a. Pick the right shape (important)

Use **Ampere (ARM)** for enough RAM to build webpack:

| Setting | Value |
|---------|--------|
| Shape | **VM.Standard.A1.Flex** (Ampere) |
| OCPUs | **1** |
| Memory | **6 GB** |

If Ampere shows **Out of capacity**, try another **Availability Domain** or region (e.g. Phoenix, San Jose, Ashburn). Avoid **E2.1.Micro** (1 GB) — deploy builds may run out of memory.

### 2b. Create the instance

1. **Menu (≡) → Compute → Instances → Create instance**
2. **Name:** `whomping-wordle`
3. **Image:** Ubuntu 22.04 (Canonical)
4. **Shape:** VM.Standard.A1.Flex → 1 OCPU, 6 GB RAM
5. **Networking:** use default VCN or create new (defaults are fine)
6. **Public IP:** Assign a **public IPv4 address**
7. **SSH keys:** Paste your Mac public key:
   ```bash
   cat ~/.ssh/github_rsa.pub
   ```
8. Click **Create**. Copy the **Public IP address** when status is **Running**.

### 2c. Open firewall ports (required — Oracle blocks 80/443 by default)

1. On the instance page, click the **Subnet** link (under Primary VNIC).
2. Click the **Security List** name.
3. **Add Ingress Rules** (each rule):

| Source CIDR | Protocol | Dest port | Description |
|-------------|----------|-----------|-------------|
| `0.0.0.0/0` | TCP | 22 | SSH |
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

4. Save.

### 2d. Test SSH from your Mac

```bash
ssh ubuntu@YOUR_PUBLIC_IP
```

Oracle Ubuntu images use user **`ubuntu`**, not `root`.

---

## Phase 3: Install Dokku on the VM (~10 min)

From your Mac (replace `YOUR_PUBLIC_IP`):

```bash
cd /Users/hannahengelhardt/Desktop/TestProject
scp scripts/setup-dokku-oracle.sh ubuntu@YOUR_PUBLIC_IP:~/
ssh ubuntu@YOUR_PUBLIC_IP 'bash ~/setup-dokku-oracle.sh whompingwordle.com'
```

The script installs Dokku, Postgres plugin, creates the app, database, and domains.

Then set your secret (run on the server):

```bash
ssh ubuntu@YOUR_PUBLIC_IP
sudo dokku config:set whomping-wordle NODE_ENV=production TOKEN_SECRET=$(openssl rand -hex 32)
```

---

## Phase 4: Deploy from your Mac

```bash
cd /Users/hannahengelhardt/Desktop/TestProject
git remote remove dokku 2>/dev/null || true
git remote add dokku dokku@YOUR_PUBLIC_IP:whomping-wordle
git push dokku feature-8-bug-fixes:main
```

Watch deploy:

```bash
ssh dokku@YOUR_PUBLIC_IP logs whomping-wordle --tail
```

First deploy takes several minutes (npm install + webpack).

---

## Phase 5: Namecheap DNS

In **Advanced DNS** for whompingwordle.com:

| Type | Host | Value |
|------|------|--------|
| A | `@` | `YOUR_PUBLIC_IP` (replace `184.169.253.131`) |
| A | `www` | `YOUR_PUBLIC_IP` |

Wait 15–30 minutes, verify:

```bash
dig whompingwordle.com +short
```

---

## Phase 6: HTTPS (after DNS points to Oracle IP)

On the server:

```bash
ssh ubuntu@YOUR_PUBLIC_IP
sudo dokku letsencrypt:set whomping-wordle email YOUR_EMAIL@example.com
sudo dokku letsencrypt:enable whomping-wordle
```

Test: [https://whompingwordle.com](https://whompingwordle.com)

---

## Troubleshooting

**SSH connection timed out**
- Check Security List has port 22 open
- Instance must be Running with public IP

**Site loads by IP but not domain**
- DNS still pointing at old GoDaddy IP — fix Namecheap A record

**`git push dokku` fails / permission denied**
- Your SSH key must be in `~/.ssh/authorized_keys` on the instance
- Dokku user needs your key: `sudo dokku ssh-keys:add admin ~/.ssh/authorized_keys` (on server)

**Build runs out of memory**
- Use Ampere 6 GB shape, not E2.1.Micro

**502 after deploy**
- `ssh dokku@YOUR_PUBLIC_IP logs whomping-wordle --tail`
- Check `sudo dokku ps:report whomping-wordle`

---

## Quick reference

| Item | Value |
|------|--------|
| SSH user | `ubuntu` |
| Dokku remote user | `dokku` |
| App name | `whomping-wordle` |
| URL | `https://whompingwordle.com` |
| Old broken IP | `184.169.253.131` |
