# Inertia Cleanup: Google Compute Engine $10 Learning Guide

This is **Project 1**: the Google VM/instance version.

Use this when you want to learn how a normal server works:

- Ubuntu server
- Docker
- FFmpeg inside Docker
- public IP
- optional domain later
- Caddy/HTTPS later

This is separate from **Project 2**, the Cloud Run version in:

```text
GOOGLE_CLOUD_FREE_TIER.md
```

## Cost Mindset

You said you have about **$10/month** for learning. Treat this VM as a learning machine, not a full production server yet.

To protect the budget:

1. Create only one VM.
2. Start small.
3. Do not add GPU.
4. Do not add load balancer.
5. Do not reserve a static IP yet.
6. Stop the VM when you are not testing.
7. Set a Google Billing budget alert before creating the VM.

Important: a stopped VM can still charge for disk storage. A reserved/static external IPv4 address can also charge. Delete resources you no longer need.

## What To Upload

Use this ZIP for the VM project:

```text
inertia-cleanup-google-vm.zip
```

Do not use the Cloud Run ZIP for this VM path.

## Step 1: Create A New Google Cloud Project

In Google Cloud Console:

1. Open:

```text
https://console.cloud.google.com
```

2. Click the project dropdown at the top.
3. Click **New Project**.
4. Name it:

```text
inertia-cleanup-vm-edu
```

5. Click **Create**.
6. Make sure this project is selected at the top.

## Step 2: Set A $10 Budget Alert

Do this before creating the server.

1. Open **Billing**.
2. Open **Budgets & alerts**.
3. Click **Create budget**.
4. Scope it to the new project:

```text
inertia-cleanup-vm-edu
```

5. Set the budget amount:

```text
$10
```

6. Add alerts:

```text
50%
90%
100%
```

Budget alerts warn you. They do not always automatically stop the server.

## Step 3: Create The VM Instance

In Google Cloud Console:

1. Search for **Compute Engine**.
2. Click **VM instances**.
3. Click **Create instance**.

Use these beginner settings:

```text
Name: inertia-cleanup-vm
Region: us-central1
Zone: any us-central1 zone
Machine type: e2-small
Boot disk: Ubuntu 24.04 LTS
Boot disk size: 20 GB or 30 GB standard persistent disk
Firewall: Allow HTTP traffic
```

For the cheapest learning test, you can try `e2-micro`, but video processing will be very slow. `e2-small` is a more realistic learning choice.

Do not choose:

```text
GPU
Load balancer
Cloud SQL
Extra disks
Static external IP
```

Click **Create**.

## Step 4: SSH Into The VM

On the VM instances page:

1. Find `inertia-cleanup-vm`.
2. Click **SSH**.
3. A browser terminal opens.

## Step 5: Install Server Tools

Paste this into the SSH terminal:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl unzip ufw
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo docker compose version
```

If `sudo docker compose version` prints a version number, Docker is ready.

## Step 6: Open Firewall On The VM

Important: run these one by one.

If the server asks for a password after `sudo`, type your Linux/server password and press **Enter**. The password will look invisible while you type. That is normal.

If you see:

```text
sudo: I'm sorry ...
```

that means the password entered for `sudo` was wrong, or pasted commands were accidentally sent while `sudo` was waiting for the password.

First test `sudo` by itself:

```bash
sudo -k
sudo -v
```

If it asks for a password, type the correct server password slowly and press **Enter**. If it works, the terminal usually returns to the normal prompt without saying much.

If you do not know the server password, stop here and fix the VM login/sudo access first. On a normal Google Compute Engine Ubuntu VM, the browser SSH user usually has sudo access. If this server keeps asking for an unknown password, it may be easier to recreate the VM using the default Google Ubuntu image and browser SSH.

Run:

```bash
sudo ufw allow OpenSSH
```

Then run:

```bash
sudo ufw allow 80
```

Then run:

```bash
sudo ufw allow 4173
```

Then run:

```bash
sudo ufw --force enable
```

Port `4173` is the direct app port for testing.

Port `80` is for domain/HTTPS setup later.

## Step 7: Upload The App ZIP

In the SSH browser window, use the upload button/menu and upload:

```text
inertia-cleanup-google-vm.zip
```

After uploading, check where the file landed:

```bash
cd ~
ls -lh
find ~ -maxdepth 3 -type f -iname "*inertia*zip"
```

If you see:

```text
cannot find or open inertia-cleanup-google-vm.zip
```

the ZIP has not reached the server yet, or it has a slightly different name. Click **UPLOAD FILE** again in the SSH browser window, choose the ZIP from your Windows computer, wait for the upload to finish, then run the `find` command again.

Then paste:

```bash
mkdir -p ~/inertia-cleanup
unzip inertia-cleanup-google-vm.zip -d ~/inertia-cleanup
cd ~/inertia-cleanup
ls
```

You should see:

```text
Dockerfile
docker-compose.yml
public
server
package.json
```

## Step 8: Start The App

Paste:

```bash
docker compose up --build -d
```

Check that it is running:

```bash
docker compose ps
curl http://localhost:4173/api/health
```

You want to see:

```json
"ffmpeg": true
```

## Step 9: Open It In Your Browser

Go back to the VM instances page.

Copy the VM **External IP**.

Open:

```text
http://YOUR_EXTERNAL_IP:4173
```

Example:

```text
http://34.123.45.67:4173
```

Important: use a colon before `4173`, not a slash.

Correct:

```text
http://34.123.45.67:4173
```

Wrong:

```text
http://34.123.45.67/4173
```

The colon means "open port 4173". The slash means "open a page named 4173 on the default web port".

If the page opens, Project 1 is online.

## If The Browser Says Connection Refused

First, make sure the URL uses a colon:

```text
http://YOUR_EXTERNAL_IP:4173
```

Then check the app inside SSH:

```bash
cd ~/inertia-cleanup
docker compose ps
curl http://localhost:4173/api/health
```

If no container is running, start it:

```bash
cd ~/inertia-cleanup
docker compose up --build -d
```

If Docker says permission denied, run:

```bash
newgrp docker
cd ~/inertia-cleanup
docker compose up --build -d
```

If `curl http://localhost:4173/api/health` works on the VM but your browser still cannot open the external IP, create a Google Cloud firewall rule allowing TCP port `4173`.

## Step 10: Stop The VM When You Finish Learning

To protect the $10 budget:

1. Go to **Compute Engine**.
2. Go to **VM instances**.
3. Select `inertia-cleanup-vm`.
4. Click **Stop**.

When you start it again, the external IP may change because you did not reserve a static IP. That is okay for learning.

## Useful Commands

Run these inside the SSH terminal.

See status:

```bash
cd ~/inertia-cleanup
docker compose ps
```

See logs:

```bash
cd ~/inertia-cleanup
docker compose logs -f
```

Restart:

```bash
cd ~/inertia-cleanup
docker compose restart
```

Stop app but keep VM running:

```bash
cd ~/inertia-cleanup
docker compose down
```

Start app again:

```bash
cd ~/inertia-cleanup
docker compose up --build -d
```

## Domain Later

Do not connect your SmartWeb domain on the first test.

First prove this works:

```text
http://YOUR_EXTERNAL_IP:4173
```

After that, you can decide if you want:

- temporary IP testing only
- static IP plus SmartWeb DNS
- Caddy for HTTPS

Static IP and public IPv4 choices can affect cost, so do that only after the basic server works.

## Project 2 Later

After Project 1 works, create a separate Google project:

```text
inertia-cleanup-cloudrun-demo
```

Then follow:

```text
GOOGLE_CLOUD_FREE_TIER.md
```

That keeps the VM learning setup and Cloud Run learning setup cleanly separated.
