# Inertia Cleanup - Google Cloud Deployment

## Overview

Inertia Cleanup is a lightweight web application deployed on Google Cloud using a modern containerized architecture.

The project demonstrates the migration of a traditional virtual machine deployment to a fully managed Cloud Run service using Docker, Artifact Registry and Terraform.

---

## Architecture

```
Developer
      │
      ▼
Docker Build
      │
      ▼
Artifact Registry
      │
      ▼
Terraform
      │
      ▼
Cloud Run
      │
      ▼
Public HTTPS URL
```

---

## Initial Deployment

The application was originally deployed on a Google Compute Engine virtual machine.

The VM hosted:

- Docker container
- Manual deployment
- Public IP access

Although functional, this required managing the server, operating system, networking and updates.

---

## Migration to Cloud Run

The infrastructure was redesigned to use a serverless deployment model.

The migration included:

- Containerizing the application
- Publishing images to Artifact Registry
- Provisioning Cloud Run using Terraform
- Deploying new application revisions
- Automatic HTTPS endpoint
- Automatic scaling

No virtual machines are required after migration.

---

## Technologies Used

- Google Cloud Run
- Google Artifact Registry
- Terraform
- Docker
- Node.js
- Git
- GitHub

---

## Project Structure

```
.
├── public/
├── server/
├── terraform/
│   ├── providers.tf
│   ├── variables.tf
│   ├── artifact-registry.tf
│   ├── cloud-run.tf
│   └── outputs.tf
├── Dockerfile
├── package.json
└── README.md
```

---

## Deployment Workflow

```
Code Changes
      │
      ▼
Docker Build
      │
      ▼
Artifact Registry
      │
      ▼
Terraform Apply
      │
      ▼
Cloud Run Revision
      │
      ▼
Application Live
```

---

## Features


- Docker containerization
- Artifact Registry image storage
- Terraform-managed infrastructure
- Cloud Run hosting
- Public HTTPS access
- Versioned container deployment

---



## Future Improvements

Possible next steps for the project include:

- Add a custom domain
- Configure GitHub Actions for automated deployment
- Add authentication for restricted access
- Store processed files in Cloud Storage
- Add monitoring and alerting
- Add application usage metrics
- Improve the media-processing workflow
- Support larger file uploads
- Add more cleanup and editing options
- Add a production-ready favicon and branding