output "server_ip" {
  description = "Public IPv4 address of the gasprice VPS"
  value       = hcloud_server.gasprice.ipv4_address
}

output "server_id" {
  description = "Hetzner server ID"
  value       = hcloud_server.gasprice.id
}

output "server_status" {
  description = "Current server status"
  value       = hcloud_server.gasprice.status
}
