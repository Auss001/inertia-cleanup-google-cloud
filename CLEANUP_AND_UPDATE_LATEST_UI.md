# Clean Project Folder And Update Latest UI

This guide explains what the real project is, what can be deleted, and how to upload the latest simplified player UI to the live Google VM.

## The Real Project Folder

Use this as the main project:

```text
outputs/inertia-cleanup
```

The current UI files are:

```text
outputs/inertia-cleanup/public/index.html
outputs/inertia-cleanup/public/styles.css
outputs/inertia-cleanup/public/app.js
```

The backend files are:

```text
outputs/inertia-cleanup/server/server.js
outputs/inertia-cleanup/server/self-test.js
```

The Docker files are:

```text
outputs/inertia-cleanup/Dockerfile
outputs/inertia-cleanup/docker-compose.yml
outputs/inertia-cleanup/Caddyfile
outputs/inertia-cleanup/.dockerignore
```

## Files To Keep

Keep these in `outputs`:

```text
outputs/inertia-cleanup
outputs/inertia-cleanup-google-vm.zip
outputs/inertia-cleanup-google-cloud.zip
outputs/Inertia_Cleanup_Stack_and_Setup_Guide.docx
```

The `inertia-cleanup` folder is the real source project.

The ZIP files are the deployment packages.

## Old Files That Were Removed

These old prototype files were removed:

```text
outputs/index.html
outputs/app.js
outputs/styles.css
```

Those belonged to the first prototype and are no longer the real project.

Some old text logs were also removed.

## Binary/Runtime Files You Can Delete Manually

Some binary files could not be removed by the patch tool because they are not UTF-8 text files.

You can delete these manually from Windows File Explorer:

```text
outputs/studio-texture.png
outputs/inertia-cleanup.rar
outputs/inertia-cleanup/data
outputs/inertia-cleanup/server.job.log
```

Important:

- `outputs/inertia-cleanup/data` contains old uploads, exports, and test files.
- The app recreates `data` automatically when it runs.
- Do not delete `outputs/inertia-cleanup/vendor` unless you no longer need local Windows FFmpeg.

## Why `vendor` Stays Locally

This folder:

```text
outputs/inertia-cleanup/vendor
```

contains local FFmpeg for Windows.

It is useful for local testing.

It is now excluded from Docker builds through `.dockerignore`, so it will not slow down Docker packaging.

## Review Of The Remaining Project

The latest UI is already in:

```text
outputs/inertia-cleanup/public
```

It is the simplified player interface with:

```text
Upload
Process
Download
Cleanse / Blur / Cover / Ultra Cover
Options
```

The live deploy package has also been refreshed:

```text
outputs/inertia-cleanup-google-vm.zip
```

That ZIP contains:

```text
Dockerfile
docker-compose.yml
Caddyfile
public/
server/
README files
```

## Update The Live Website To Latest UI

Live website:

```text
https://cleanup.agroalive.com.ng
```

Upload package:

```text
outputs/inertia-cleanup-google-vm.zip
```

### Step 1: Open The VM

Go to Google Cloud Console:

```text
Compute Engine > VM instances
```

Click:

```text
SSH
```

beside your VM.

### Step 2: Upload The ZIP

In the SSH browser window, click:

```text
Upload file
```

Upload:

```text
inertia-cleanup-google-vm.zip
```

### Step 3: Unzip Over The Existing App

In SSH:

```bash
cd ~
unzip -o inertia-cleanup-google-vm.zip -d ~/inertia-cleanup
cd ~/inertia-cleanup
```

Meaning:

- `cd ~` takes you to the server home folder.
- `unzip -o` opens the ZIP and overwrites old app files.
- `-d ~/inertia-cleanup` puts the files inside the app folder.

### Step 4: Rebuild Docker

Run:

```bash
docker compose up --build -d
```

Meaning:

- `docker compose` reads `docker-compose.yml`.
- `up` starts the containers.
- `--build` rebuilds the app using the latest UI files.
- `-d` keeps it running in the background.

### Step 5: Confirm Containers Are Running

Run:

```bash
docker compose ps
```

You want to see:

```text
inertia-cleanup
caddy
```

### Step 6: Confirm Backend Health

Run:

```bash
curl http://localhost:4173/api/health
```

You want:

```json
"ffmpeg": true
```

### Step 7: Open The Website

Open:

```text
https://cleanup.agroalive.com.ng
```

If it still shows the old UI, refresh hard:

```text
Ctrl + F5
```

## Quick Mental Model

```text
Local latest UI
-> ZIP package
-> Upload to Google VM
-> Unzip into ~/inertia-cleanup
-> Docker rebuilds the app
-> Caddy serves it through HTTPS
-> Browser opens cleanup.agroalive.com.ng
```

