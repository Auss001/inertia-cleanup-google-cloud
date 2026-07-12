# Inertia Cleanup: Cloud Run From Google Cloud Console

This is **Project 2**: the Cloud Run learning deployment.

Use this when you want to deploy from inside Google Cloud Console without using your local terminal.

Cloud Run is the safer $10-credit learning option because it can scale to zero when idle.

## Important Limits

This Cloud Run setup is for:

- demo
- testing
- small videos
- Cloud Run practice

It is not yet the full production SaaS architecture.

Why:

- The app stores uploads/exports on local container disk.
- Job state is kept in memory.
- Files can disappear when Cloud Run restarts or scales to zero.
- Download the processed file immediately after processing.

## Cost Safety Settings

Use these settings:

```text
Region: us-central1
Memory: 1 GiB
CPU: 1
Min instances: 0
Max instances: 1
Concurrency: 1
Timeout: 3600 seconds
Max upload: 100 MB
```

Do not add:

```text
Cloud SQL
Load balancer
GKE
GPU
Always-on minimum instances
```

## Step 1: Create A New Project

In Google Cloud Console:

1. Open the project dropdown.
2. Click **New Project**.
3. Name it:

```text
inertia-cleanup-cloudrun-demo
```

4. Select the new project.

## Step 2: Set A $10 Budget Alert

Go to:

```text
Billing > Budgets & alerts
```

Create:

```text
Budget amount: $10
Alerts: 50%, 90%, 100%
```

Budget alerts warn you. They do not always stop resources automatically.

## Step 3: Open Cloud Shell

In Google Cloud Console, click the terminal icon:

```text
Activate Cloud Shell
```

This opens a Linux terminal inside your browser.

## Step 4: Upload The Cloud Run ZIP

In Cloud Shell, click the upload button and upload:

```text
inertia-cleanup-google-cloud.zip
```

## Step 5: Unzip

In Cloud Shell:

```bash
unzip inertia-cleanup-google-cloud.zip -d inertia-cleanup-cloudrun
cd inertia-cleanup-cloudrun
ls
```

You should see:

```text
Dockerfile
package.json
public
server
```

## Step 6: Enable Services

Run:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## Step 7: Deploy To Cloud Run

Run:

```bash
gcloud run deploy inertia-cleanup \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 1 \
  --timeout 3600 \
  --min-instances 0 \
  --max-instances 1 \
  --set-env-vars INLINE_JOBS=true,MAX_UPLOAD_MB=100
```

When it asks to continue, type:

```text
Y
```

Cloud Run will give you a URL like:

```text
https://inertia-cleanup-xxxxx-uc.a.run.app
```

## Step 8: Test

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

Upload a small image or short video first.

## Step 9: Watch Cost

Check:

```text
Billing > Reports
```

Check again:

```text
after 24 hours
after 3 days
weekly while testing
```

## Step 10: Delete When Done

If this is only a learning test:

```bash
gcloud run services delete inertia-cleanup --region us-central1
```

Also check Artifact Registry because built container images can remain there.

## Notes

Cloud Run does not need Caddy, Apache, NGINX, or Google Compute Engine firewall rules for the default `run.app` URL.

Caddy stays with the VM version.

