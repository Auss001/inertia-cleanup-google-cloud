# Deployment Guide

Inertia Cleanup can run on most servers because it only needs Node.js and FFmpeg.

## Best simple deployment: Docker

Use Docker when possible because the included `Dockerfile` installs FFmpeg for you.

```bash
docker compose up --build -d
```

Then visit:

```text
http://your-server-ip:4173
```

Put a reverse proxy like Nginx, Caddy, Cloudflare Tunnel, or Traefik in front of it for HTTPS and a real domain.

## VPS deployment without Docker

On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y nodejs npm ffmpeg
cd inertia-cleanup
npm start
```

For production, use a process manager:

```bash
npm install -g pm2
pm2 start server/server.js --name inertia-cleanup
pm2 save
```

## What to add before selling it publicly

This project is ready as a working local/full-stack foundation. Before charging real users, add:

- User accounts and login.
- Stripe subscriptions or credits.
- A database for users, jobs, and payment status.
- Object storage such as S3, Cloudflare R2, or Backblaze B2.
- A background job queue for long videos.
- Rate limits and upload limits per user.
- Automatic deletion of old uploads/exports.
- Terms that require users to own or have permission to edit uploaded media.

## Server environment variables

- `PORT`: default `4173`.
- `MAX_UPLOAD_MB`: default `2048`.
- `FFMPEG_PATH`: optional full path to FFmpeg if it is not on PATH.

Example:

```bash
PORT=8080 MAX_UPLOAD_MB=4096 npm start
```

## Public marketing checklist

- Buy a domain.
- Deploy the app.
- Add HTTPS.
- Add a landing page CTA connected to payment/signup.
- Add demo videos made from media you own.
- Add privacy policy and acceptable use policy.
