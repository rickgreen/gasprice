provider "hcloud" {
  token = var.hcloud_token
}

# Upload the deploy SSH key to Hetzner so the server is reachable after creation.
resource "hcloud_ssh_key" "deploy" {
  name       = "${var.server_name}-deploy"
  public_key = file(var.ssh_public_key_path)
}

resource "hcloud_server" "gasprice" {
  name        = var.server_name
  server_type = var.server_type
  location    = var.server_location
  image       = var.server_image
  ssh_keys    = [hcloud_ssh_key.deploy.id]

  labels = {
    project = "gasprice"
    managed = "terraform"
  }
}
