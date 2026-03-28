variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key to install on the server"
  type        = string
  default     = "~/.ssh/gasprice_deploy.pub"
}

variable "server_name" {
  description = "Name of the Hetzner VPS"
  type        = string
  default     = "gasprice"
}

variable "server_type" {
  description = "Hetzner server type (size)"
  type        = string
  default     = "cx22"
}

variable "server_location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"
}

variable "server_image" {
  description = "OS image for the server"
  type        = string
  default     = "ubuntu-24.04"
}
