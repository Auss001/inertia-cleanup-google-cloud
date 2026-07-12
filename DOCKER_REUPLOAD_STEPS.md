# Inertia Cleanup: Docker Re-Upload Steps

Use this when you changed the app locally and want to update the live Google VM site.

Live site:

```text
https://cleanup.agroalive.com.ng
```

Docker package to upload:

```text
inertia-cleanup-google-vm.zip
```

## What Is Inside The Docker Setup

```text
Dockerfile
```

Builds the app container with:

- Node.js
- FFmpeg
- Inertia Cleanup backend
- Inertia Cleanup frontend

```text
docker-compose.yml
```

Runs:

- `inertia-cleanup` app container on port `4173`
- `caddy` web server on ports `80` and `443`

```text
Caddyfile
```

Connects:

```text
cleanup.agroalive.com.ng -> inertia-cleanup:4173
```

## Re-Upload To Google VM

1. Open Google Cloud Console.
2. Go to:

```text
Compute Engine > VM instances
```

3. Click **SSH** beside the VM.
4. Click **Upload file**.
5. Upload:

```text
inertia-cleanup-google-vm.zip
```

6. In SSH, run:

```bash
cd ~
unzip -o inertia-cleanup-google-vm.zip -d ~/inertia-cleanup
cd ~/inertia-cleanup
docker compose up --build -d
docker compose ps
```

7. Test the app container:

```bash
curl http://localhost:4173/api/health
```

You want:

```json
"ffmpeg": true
```

8. Test Caddy:

```bash
curl -I -H "Host: cleanup.agroalive.com.ng" http://127.0.0.1
```

9. Open:

```text
https://cleanup.agroalive.com.ng
```

## Useful Docker Commands

See running containers:

```bash
docker compose ps
```

See app logs:

```bash
docker compose logs -f inertia-cleanup
```

See Caddy logs:

```bash
docker compose logs -f caddy
```

Restart everything:

```bash
docker compose restart
```

Rebuild after a new upload:

```bash
docker compose up --build -d
```

