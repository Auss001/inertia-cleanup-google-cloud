output "artifact_registry_repository" {
  description = "Artifact Registry repository path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repository}"
}

output "docker_image_uri" {
  description = "Full Docker image URI"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repository}/${var.image_name}:${var.image_tag}"
}

output "cloud_run_url" {
  description = "Public URL of the Inertia Cleanup Cloud Run service"
  value       = google_cloud_run_v2_service.inertia_cleanup.uri
}