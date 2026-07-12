# Google Kubernetes Engine: $10 Learning Lab

This is a **Kubernetes learning lab**, not the recommended place to run Inertia Cleanup under a $10 monthly credit.

Use Cloud Run for the app.

Use GKE only to learn Kubernetes concepts:

- cluster
- pod
- deployment
- service
- kubectl
- logs
- scaling
- deletion

## Cost Warning

GKE has a free-tier credit for the cluster management fee, but compute, networking, load balancers, and other resources can still cost money.

For a $10 learning budget:

1. Create only one lab cluster.
2. Use Autopilot.
3. Do not expose a public LoadBalancer.
4. Do not run the cluster for days.
5. Delete the cluster after the lesson.

## Best Lab Approach

Use:

```text
GKE Autopilot
us-central1
one tiny hello app
no public load balancer
delete same day
```

## Step 1: Enable GKE

In Google Cloud Console:

```text
Kubernetes Engine > Enable
```

## Step 2: Create A Small Autopilot Cluster

Use Cloud Shell:

```bash
gcloud container clusters create-auto inertia-k8s-lab \
  --region us-central1
```

## Step 3: Connect kubectl

```bash
gcloud container clusters get-credentials inertia-k8s-lab \
  --region us-central1
```

## Step 4: Deploy A Tiny Sample App

```bash
kubectl create deployment hello \
  --image=us-docker.pkg.dev/google-samples/containers/gke/hello-app:1.0
```

Check:

```bash
kubectl get pods
kubectl get deployments
```

## Step 5: View It Without Creating A Load Balancer

Use port-forward:

```bash
kubectl port-forward deployment/hello 8080:8080
```

Cloud Shell will show a web preview option.

Do not create a LoadBalancer for this $10 lab unless you are intentionally testing paid networking.

## Step 6: Clean Up

When done:

```bash
gcloud container clusters delete inertia-k8s-lab \
  --region us-central1
```

Type:

```text
Y
```

Then check:

```text
Billing > Reports
```

## Why Not Run Inertia Cleanup On GKE Yet?

The app needs:

- persistent storage for uploads/exports
- job queue
- worker process
- resource limits
- object storage
- production monitoring

That is a bigger Kubernetes project. Learn GKE with a tiny app first, then move Inertia Cleanup later when the architecture is ready.

