variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "artifact_repository" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "inertia-containers"
}

variable "image_name" {
  description = "Docker image name"
  type        = string
  default     = "inertia-cleanup"
}
variable "image_tag" {
  description = "Version tag of the Docker image deployed to Cloud Run"
  type        = string
  default     = "v1"
}