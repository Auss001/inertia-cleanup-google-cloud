# Google Cloud Free-Tier Safe Plan

This guide is for keeping the Google deployment as close to **free tier** as possible.

## Important Truth

The full production version of Inertia Cleanup is not a true free-tier product because video processing uses CPU, storage, and outbound bandwidth. The safest free-tier setup is a **demo/testing deployment** with small files and low traffic.

For a public business launch, expect to pay for hosting.

## Best Free-Tier Choice

Use **Cloud Run**, not Compute Engine VM, for the free-tier demo.

Why:

- Cloud Run has a monthly free allowance.
- It gives you an HTTPS URL automatically.
- You do not need Caddy, Apache, or NGINX.
- You avoid the usual always-running VM cost.

## Avoid This If You Want Free Tier

Avoid a normal Compute Engine VM for this goal.

Google's always-free Compute Engine VM is only:

- 1 `e2-micro`
- specific US regions only
- 30 GB standard disk
- very small outbound data allowance

Also, public IPv4 addresses can create charges. A VM is simpler for production, but Cloud Run is safer for a free-tier demo.

## Cloud Run Free-Tier Deployment

### 1. Open Google Cloud Shell

Go to:

```text
https://console.cloud.google.com
```

Click the terminal icon at the top right: **Activate Cloud Shell**.

### 2. Upload The Zip

Upload:

```text
inertia-cleanup-google-cloud.zip
```

### 3. Unzip It

```bash
unzip inertia-cleanup-google-cloud.zip -d inertia-cleanup
cd inertia-cleanup
```

### 4. Set Your Project

Replace `YOUR_PROJECT_ID`:

```bash
gcloud config set project YOUR_PROJECT_ID
```

### 5. Enable Required Services

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### 6. Deploy To Cloud Run

Use a US free-tier friendly region:

```bash
gcloud run deploy inertia-cleanup \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 3600 \
  --max-instances 1 \
  --set-env-vars INLINE_JOBS=true,MAX_UPLOAD_MB=100
```

Cloud Run will give you a URL like:

```text
https://inertia-cleanup-xxxxx-uc.a.run.app
```

Use that URL for testing.

## Free-Tier Safety Rules

To reduce surprise charges:

1. Keep `--max-instances 1`.
2. Keep uploads small.
3. Do not let the public use it yet.
4. Do not connect Cloud SQL yet.
5. Do not add GPUs.
6. Do not use a load balancer yet.
7. Use the Cloud Run default URL first.
8. Set a budget alert in Google Cloud Billing.

## Set A Budget Alert

In Google Cloud Console:

1. Go to **Billing**.
2. Click **Budgets & alerts**.
3. Click **Create budget**.
4. Set budget amount:

```text
$1
```

5. Add alerts at:

```text
50%
90%
100%
```

This does not always hard-stop resources, but it warns you quickly.

## Test After Deployment

Open:

```text
https://YOUR_CLOUD_RUN_URL/api/health
```

You want:

```json
"ffmpeg": true
```

Then open:

```text
https://YOUR_CLOUD_RUN_URL
```

## What To Expect

This free-tier setup is for:

- demo
- testing
- screenshots
- small videos
- showing investors/friends

It is not for:

- many users
- long videos
- paid customers
- unlimited public traffic

## When You Are Ready For Marketing

Move from free-tier demo to paid production:

- Cloud Run or Compute Engine with paid resources
- Cloud Storage for files
- Firestore or Cloud SQL for users/jobs
- Paystack payments
- queue-based video worker
- domain and brand site
- Terms, Privacy, Acceptable Use
