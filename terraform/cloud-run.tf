resource "google_cloud_run_v2_service" "inertia_cleanup" {
  name     = "inertia-cleanup"
  location = var.region
  project  = var.project_id

  deletion_protection = false

  template {
    max_instance_request_concurrency = 1
    timeout                          = "3600s"

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repository}/${var.image_name}:${var.image_tag}"

      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
      }

      env {
        name  = "INLINE_JOBS"
        value = "true"
      }

      env {
        name  = "MAX_UPLOAD_MB"
        value = "25"
      }

      ports {
        container_port = 8080
      }
    }
  }

  depends_on = [
    google_project_service.cloud_run,
    google_artifact_registry_repository.containers
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_access" {
  project  = var.project_id
  location = google_cloud_run_v2_service.inertia_cleanup.location
  name     = google_cloud_run_v2_service.inertia_cleanup.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}