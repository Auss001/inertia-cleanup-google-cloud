# Inertia Cleanup on Google Cloud: Rookie-Friendly Guide

## Read This First

If your instruction is **free tier only**, do not start with this VM guide.

Use this guide instead:

```text
GOOGLE_CLOUD_FREE_TIER.md
```

That free-tier guide uses **Cloud Run** with:

- `--max-instances 1`
- `INLINE_JOBS=true`
- small uploads
- the default Cloud Run HTTPS URL

This current file is the **paid/simple server guide** using **Google Compute Engine**. It is useful later when you want a normal always-on server, a custom domain, Caddy, and production-style control.

## Why This VM Guide May Cost Money

Google Compute Engine can create charges for CPU, disk, bandwidth, and public IPv4 addresses. Even when a VM looks small, it is not the safest choice for a strict $0 setup.

For the free-tier demo, use Cloud Run first.

## What You Need

- A Google account.
- A Google Cloud account with billing enabled.
- The `inertia-cleanup` project folder.
- A domain name, optional at first.
- Basic patience. The first deployment always feels longer than it is.

## Recommended VM Size For Paid Testing

For testing:

- Ubuntu 24.04 LTS
- 2 vCPU
- 4 GB RAM
- 50 GB disk

For real users:

- Ubuntu 24.04 LTS
- 4 vCPU
- 8 GB RAM
- 100 GB disk or more

Video processing is CPU-heavy, so do not use the smallest free-tier machine for real video work.

## Step 1: Create A Google Cloud Project

1. Go to `https://console.cloud.google.com`.
2. Click the project dropdown at the top.
3. Click **New Project**.
4. Name it:

```text
inertia-cleanup
```

5. Click **Create**.
6. Make sure billing is enabled.

## Step 2: Create The Server

1. In Google Cloud Console, search for **Compute Engine**.
2. Go to **VM instances**.
3. Click **Create instance**.
4. Name:

```text
inertia-cleanup-vm
```

5. Region:

```text
europe-west1
```

This is usually a reasonable region for Nigeria. You can also test other Europe regions.

6. Machine type:

```text
e2-standard-2
```

For real usage, use `e2-standard-4`.

7. Boot disk:

```text
Ubuntu 24.04 LTS
50 GB balanced persistent disk
```

8. Firewall:

Tick:

```text
Allow HTTP traffic
Allow HTTPS traffic
```

9. Click **Create**.

## Step 3: SSH Into The Server

On the VM instances page, click **SSH** beside your VM.

A browser terminal will open.

## Step 4: Install Docker

Run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl ufw unzip
curl -fsSL https://get.docker.com | sh
sudo apt install -y docker-compose-plugin
```

Allow web traffic:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 4173
sudo ufw --force enable
```

## Step 5: Upload The App Folder

Beginner method:

1. Zip your local `inertia-cleanup` folder.
2. In the Google Cloud SSH window, click the settings/gear icon or upload option.
3. Upload the zip file.
4. Unzip it:

```bash
mkdir -p /opt/inertia-cleanup
unzip inertia-cleanup.zip -d /opt/inertia-cleanup-temp
```

If the zip contains the folder itself, move into it:

```bash
sudo mv /opt/inertia-cleanup-temp/inertia-cleanup/* /opt/inertia-cleanup/
```

If it only contains the files directly, use:

```bash
sudo mv /opt/inertia-cleanup-temp/* /opt/inertia-cleanup/
```

Then:

```bash
cd /opt/inertia-cleanup
```

## Step 6: Start The App

Run:

```bash
sudo docker compose up --build -d
```

Check it:

```bash
sudo docker ps
curl http://localhost:4173/api/health
```

You want to see:

```json
"ffmpeg": true
```

## Step 7: Test From Your Browser

Copy your VM external IP from the Google Cloud VM page.

Open:

```text
http://YOUR_SERVER_IP:4173
```

Example:

```text
http://34.89.123.45:4173
```

If it works, the app is online.

## Step 8: Add A Domain And HTTPS

Buy a domain such as:

```text
inertiacleanup.com
inertiacleanup.com.ng
```

In your domain DNS, add:

```text
Type: A
Name: @
Value: YOUR_SERVER_IP
```

Install Caddy:

```bash
sudo apt install -y caddy
```

Edit the Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Use this, replacing the domain:

```text
yourdomain.com.ng {
    request_body {
        max_size 2048MB
    }

    reverse_proxy 127.0.0.1:4173
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

Open:

```text
https://yourdomain.com.ng
```

## Step 9: Keep It Running

Docker Compose is configured with:

```text
restart: unless-stopped
```

So the app should restart automatically if the server reboots.

Useful commands:

```bash
cd /opt/inertia-cleanup
sudo docker compose ps
sudo docker compose logs -f
sudo docker compose restart
sudo docker compose down
sudo docker compose up --build -d
```

## What It Takes To Become A Full Online SaaS

The current app is a working foundation. A public paid product needs:

1. User accounts.
2. Paystack or Flutterwave payments.
3. Credit balance system.
4. Database for users and jobs.
5. Cloud Storage for uploads and exports.
6. Background queue for long video processing.
7. Admin dashboard.
8. Automatic file deletion.
9. Terms of use and privacy policy.
10. Abuse prevention and rate limits.

## Suggested Full Google Cloud Architecture Later

- Frontend/backend: Cloud Run or Compute Engine.
- User database: Cloud SQL for PostgreSQL.
- File storage: Cloud Storage bucket.
- Job queue: Cloud Tasks or Pub/Sub.
- Video worker: Cloud Run Jobs, Compute Engine worker, or GPU VM later.
- Payments: Paystack first for Nigeria.
- Domain + HTTPS: Cloud Load Balancer or Caddy on Compute Engine.

## Cloud Run Free-Tier Note

Cloud Run is now supported for demo/testing by setting:

```bash
INLINE_JOBS=true
```

That makes the app finish the cleanup during the upload request. This is simpler for a free-tier demo, but it is still not the final production architecture for many users or long videos. Production should add Cloud Storage, a database, and a queue-based worker.
