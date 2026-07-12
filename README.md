# Inertia Cleanup

Inertia Cleanup is a full-stack, video-first media cleanup application for files you own or have permission to edit. It includes a marketable frontend, a local Node backend, upload/job APIs, and FFmpeg processing.

## Start here

For local use on this computer, read:

```text
LOCAL-QUICKSTART.md
```

For putting it online, read:

```text
DEPLOYMENT.md
```

For the full project case study, original file map, deployment walkthrough, and LinkedIn post, read:

```text
PROJECT_CASE_STUDY_README.md
```

For cleaning the project folder and updating the live site to the latest simplified UI, read:

```text
CLEANUP_AND_UPDATE_LATEST_UI.md
```

For your $10/month Google Compute Engine learning project, read:

```text
GOOGLE_COMPUTE_ENGINE_10_DOLLAR_GUIDE.md
```

For connecting your domain with Caddy on the Google VM, read:

```text
CADDY_DOMAIN_SETUP.md
```

For the separate Cloud Run free-tier demo project, read:

```text
GOOGLE_CLOUD_FREE_TIER.md
```

For deploying this app to Cloud Run from Google Cloud Console/Cloud Shell, read:

```text
GOOGLE_CLOUD_RUN_CONSOLE_GUIDE.md
```

For a small Kubernetes learning lab under a $10 budget, read:

```text
GKE_10_DOLLAR_LEARNING_LAB.md
```

## What it does

- Upload images and videos.
- Draw a cleanup region in the browser.
- Process images and videos on the backend with FFmpeg.
- Export videos as MP4 while retaining source audio when audio exists.
- Use high-quality video settings with H.264, `crf` controls, and `+faststart`.
- Offer four cleanup styles: Cleanse (`delogo`), Blur, Cover, and Ultra Cover.

## Requirements

- Node.js 18 or newer.
- FFmpeg installed and available on PATH, or set `FFMPEG_PATH` to the full path of `ffmpeg.exe`.

## Windows install

Open PowerShell in this folder and run:

```powershell
doctor-windows.cmd
```

If FFmpeg is missing, install it with:

```powershell
download-ffmpeg.cmd
```

This downloads a local copy into the project. You can also install FFmpeg system-wide and put it on PATH.

## Run

```powershell
start-local.cmd
```

Open:

```text
http://localhost:4173
```

## API

Create a job:

```http
POST /api/jobs
Content-Type: multipart/form-data
```

Fields:

- `file`: media file.
- `region`: JSON with `x`, `y`, `width`, `height`.
- `options`: JSON with `mode`, `crf`, `strength`, and `color`.

Poll:

```http
GET /api/jobs/:id
```

Download:

```http
GET /download/:id
```

## Production notes

For a commercial deployment, put this Node app behind a reverse proxy, add authentication, persist jobs in a database, move uploads to object storage, add payment handling, and run FFmpeg jobs in a queue worker.
