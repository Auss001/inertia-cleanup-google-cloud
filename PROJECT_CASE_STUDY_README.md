# Inertia Cleanup Project Case Study

Inertia Cleanup is a full-stack media cleanup web application built for authorized image and video editing. The project started as a local browser app and was expanded into a cloud-deployed Docker application with a real domain, HTTPS, FFmpeg-backed processing, and a cleaner player-style frontend.

## Original Project Files

The real project folder is:

```text
C:\Users\Administrator\Documents\Codex\2026-06-14\build-a-web-based-application-that\outputs\inertia-cleanup
```

The main source files are:

```text
public/index.html       Frontend page
public/styles.css       Frontend styling
public/app.js           Browser logic and upload workflow
server/server.js        Node.js backend and FFmpeg job processor
server/self-test.js     Local media processing test
Dockerfile              App container build
docker-compose.yml      App + Caddy container setup
Caddyfile               Domain reverse proxy config
```

The older first prototype is here, but it is not the main project anymore:

```text
C:\Users\Administrator\Documents\Codex\2026-06-14\build-a-web-based-application-that\outputs\index.html
```

Use this folder as the main project:

```text
outputs/inertia-cleanup
```

## Live And Local URLs

Local development URL:

```text
http://localhost:4173
```

Cloud VM direct testing URL:

```text
http://35.232.153.198:4173
```

Public domain URL:

```text
https://cleanup.agroalive.com.ng
```

## What The App Does

- Uploads images and videos.
- Lets the user draw a region over the media.
- Processes that selected region using FFmpeg.
- Supports four cleanup styles:
  - Cleanse
  - Blur
  - Cover
  - Ultra Cover
- Exports videos as MP4.
- Retains source audio when the input video contains audio.
- Provides a simplified player-style interface with Upload, Process, and Download buttons.

The app is designed for media the user owns or has permission to edit.

## Tech Stack

Frontend:

- HTML
- CSS
- Vanilla JavaScript
- Canvas-based region selector
- Native browser video player

Backend:

- Node.js HTTP server
- Multipart upload handling
- Job status API
- Download endpoint

Media Processing:

- FFmpeg
- FFprobe
- H.264 MP4 export
- Audio stream copy with `-c:a copy`

Container And Server:

- Docker
- Docker Compose
- Caddy reverse proxy
- Let's Encrypt HTTPS via Caddy

Cloud And Deployment:

- Google Cloud Compute Engine VM
- Google Cloud firewall rules
- cPanel/Zone Editor DNS
- A record for subdomain routing
- Cloud Run guide prepared for a separate deployment
- GKE learning lab guide prepared for Kubernetes practice

## Final Architecture

```text
Visitor
-> https://cleanup.agroalive.com.ng
-> DNS A record points to Google VM
-> Google Cloud firewall allows ports 80 and 443
-> Caddy receives HTTPS request
-> Caddy forwards request to inertia-cleanup:4173
-> Node.js backend serves frontend and API
-> FFmpeg processes uploaded media
-> User downloads cleaned export
```

## Local Development Process

Start the app locally:

```powershell
cd C:\Users\Administrator\Documents\Codex\2026-06-14\build-a-web-based-application-that\outputs\inertia-cleanup
start-local.cmd
```

Open:

```text
http://localhost:4173
```

Check backend health:

```powershell
Invoke-WebRequest -Uri http://localhost:4173/api/health -UseBasicParsing
```

Expected result:

```json
"ffmpeg": true
```

## Docker Packaging

The app was containerized with a `Dockerfile`.

The Dockerfile:

- Starts from `node:20-bookworm-slim`.
- Installs FFmpeg.
- Copies the backend and frontend files.
- Exposes port `4173`.
- Starts the Node server.

Docker Compose runs two services:

```text
inertia-cleanup    The Node.js + FFmpeg app
caddy              The public web server for HTTP/HTTPS
```

## Google VM Deployment Process

The upload package is:

```text
C:\Users\Administrator\Documents\Codex\2026-06-14\build-a-web-based-application-that\outputs\inertia-cleanup-google-vm.zip
```

The deployment process used:

1. Open Google Cloud Console.
2. Go to:

```text
Compute Engine > VM instances
```

3. Open the VM with browser SSH.
4. Upload:

```text
inertia-cleanup-google-vm.zip
```

5. Unzip the new app files into the server project folder:

```bash
cd ~
unzip -o inertia-cleanup-google-vm.zip -d ~/inertia-cleanup
cd ~/inertia-cleanup
```

6. Rebuild and restart the containers:

```bash
docker compose up --build -d
```

7. Confirm containers are running:

```bash
docker compose ps
```

8. Confirm the backend is healthy:

```bash
curl http://localhost:4173/api/health
```

Expected:

```json
"ffmpeg": true
```

9. Open the public website:

```text
https://cleanup.agroalive.com.ng
```

## Domain And HTTPS Process

The chosen subdomain was:

```text
cleanup.agroalive.com.ng
```

The DNS record created was:

```text
Type: A
Name: cleanup
Value: 35.232.153.198
```

The Caddyfile:

```text
cleanup.agroalive.com.ng {
    encode gzip
    reverse_proxy inertia-cleanup:4173
}
```

Caddy handled HTTPS automatically through Let's Encrypt.

Successful Caddy log messages included:

```text
authorization finalized
validations succeeded
certificate obtained successfully
```

## Problems Solved Along The Way

### Too Many HTML Files

There was an early prototype at:

```text
outputs/index.html
```

The real app became:

```text
outputs/inertia-cleanup/public/index.html
```

### Opening The HTML File Directly

Opening the HTML with `file://` did not run the backend.

Correct method:

```text
http://localhost:4173
```

### Port Confusion

The app originally worked through:

```text
http://35.232.153.198:4173
```

The colon `:4173` means the browser is visiting port 4173 on the server.

After Caddy was added, the app worked through:

```text
https://cleanup.agroalive.com.ng
```

### Sudo / Firewall Confusion

The VM had issues with `sudo` password prompts, so the firewall was managed through Google Cloud firewall rules instead of Ubuntu `ufw`.

Rules used:

```text
tcp:4173
tcp:80,443
```

### Nano Missing

The minimal Ubuntu server did not include `nano`.

Instead of:

```bash
nano Caddyfile
```

This method was used:

```bash
cat > Caddyfile <<'EOF'
cleanup.agroalive.com.ng {
    encode gzip
    reverse_proxy inertia-cleanup:4173
}
EOF
```

### DNS NXDOMAIN

Caddy showed `NXDOMAIN` until the DNS record became publicly visible.

The fix was to use a domain that resolved publicly and create the correct A record.

### FFmpeg Code 1

Some cleanup regions near the edge of a video caused FFmpeg to fail.

The backend was improved to clamp selected regions inside the video frame and return clearer FFmpeg errors.

### Localhost Not Opening

When `http://localhost:4173` did not open, the reason was usually that the local Node server was not running.

Fix:

```powershell
start-local.cmd
```

## Verification Performed

Local checks included:

```text
Frontend JavaScript syntax check
Backend syntax check
FFmpeg availability check
Self-test video processing
Audio stream retention check
Edge cleanup test
```

The self-test confirmed exported videos contained:

```text
H.264 video
AAC audio
```

## Cloud Run And Kubernetes Notes

A Cloud Run deployment guide was prepared for a separate learning project:

```text
GOOGLE_CLOUD_RUN_CONSOLE_GUIDE.md
```

A small Kubernetes/GKE learning lab was also prepared:

```text
GKE_10_DOLLAR_LEARNING_LAB.md
```

Cloud Run is better for low-cost app hosting experiments.

GKE/Kubernetes is better treated as a short learning lab under a small budget because clusters, compute, networking, and load balancers can create costs if left running.

## Billing Lessons

Google Cloud billing should be checked:

```text
Immediately after deployment
After 24 hours
After 3 days
Weekly while testing
```

Main cost areas to watch:

```text
Compute Engine VM
Persistent disk
External IP
Network egress
Cloud Run builds/images
GKE clusters if created
```

Budget alerts should be set at:

```text
50%
90%
100%
```

## Useful Commands

Start local app:

```powershell
start-local.cmd
```

Check local port:

```powershell
netstat -ano | findstr :4173
```

Check Docker containers on VM:

```bash
docker compose ps
```

View app logs:

```bash
docker compose logs -f inertia-cleanup
```

View Caddy logs:

```bash
docker compose logs -f caddy
```

Rebuild after upload:

```bash
docker compose up --build -d
```

## Future Improvements

Production upgrades would include:

- User accounts
- Payment integration
- Job history
- Cloud Storage for uploaded/exported files
- Database for users and jobs
- Background queue for long video processing
- Admin dashboard
- Rate limiting
- Abuse prevention
- Terms of Use and Privacy Policy
- Proper authorization flow for media ownership/rights

## LinkedIn Post

I recently completed a full-stack cloud deployment project called **Inertia Cleanup**.

The goal was to take a media-processing web app from a local prototype to a real deployed application with a cleaner frontend, backend processing, Docker, a cloud server, a domain, and HTTPS.

What I built:

- A browser-based upload interface for images and videos
- A canvas region selector for choosing the area to clean
- A Node.js backend with upload and job APIs
- FFmpeg-powered video/image processing
- MP4 video export with source audio retained
- Docker containerization
- Docker Compose setup with the app and Caddy
- Google Cloud Compute Engine deployment
- DNS setup with a custom subdomain
- HTTPS through Caddy and Let's Encrypt
- Cloud Run and Kubernetes learning guides for the next phase

Some key lessons:

- Docker makes deployments repeatable
- Caddy is a simple way to put HTTPS in front of an app
- DNS propagation can be confusing but is very important
- Ports matter: `4173` was the app port, while `80` and `443` became the public web ports
- Cloud billing must be watched from day one
- FFmpeg is powerful, but edge cases need careful handling

The final deployed app runs through:

```text
https://cleanup.agroalive.com.ng
```

This project helped me connect many pieces of real-world software deployment: frontend, backend, media processing, Docker, Linux, Google Cloud, DNS, SSL, and troubleshooting.

It was not just about building an app. It was about understanding how an app actually becomes available on the internet.

#WebDevelopment #Docker #GoogleCloud #NodeJS #FFmpeg #CloudComputing #DevOps #LearningInPublic #SoftwareEngineering

