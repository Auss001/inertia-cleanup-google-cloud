# Local Quickstart

This is the simplest way to run Inertia Cleanup on this computer.

## 1. Open PowerShell in this folder

Folder:

```text
C:\Users\Administrator\Documents\Codex\2026-06-14\build-a-web-based-application-that\outputs\inertia-cleanup
```

## 2. Check your setup

```bat
doctor-windows.cmd
```

If you prefer PowerShell and script execution is allowed, `.\doctor-windows.ps1` also works.

You need:

- Node.js to run the website/backend.
- FFmpeg to process videos and keep audio.

## 3. Install FFmpeg if missing

Easiest project-local install:

```bat
download-ffmpeg.cmd
```

Alternative system install if `winget` exists:

```bat
winget install Gyan.FFmpeg
```

Close PowerShell and open it again after installing FFmpeg.

## 4. Start the app

```bat
start-local.cmd
```

If you prefer PowerShell and script execution is allowed, `.\start-local.ps1` also works.

Then open:

```text
http://localhost:4173
```

Optional verification:

```bat
npm run self-test
```

The self-test creates a tiny video with audio, uploads it to the backend, downloads the result, and confirms the output still has audio.

## 5. Use the app

1. Click **Launch studio**.
2. Click **Upload media**.
3. Choose a picture or video.
4. Drag a box over the area you want to clean.
5. Choose **Cleanse**, **Blur**, **Cover**, or **Ultra Cover**.
6. Click **Process full-quality export**.
7. Download the finished file.

Video exports keep audio when FFmpeg is installed and the original video has audio.
