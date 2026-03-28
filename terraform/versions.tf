terraform {
  required_version = ">= 1.5.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }

  # Remote state in Hetzner Object Storage (S3-compatible).
  # Initialise with:
  #   terraform init \
  #     -backend-config="access_key=$HETZNER_S3_ACCESS_KEY" \
  #     -backend-config="secret_key=$HETZNER_S3_SECRET_KEY"
  backend "s3" {
    bucket = "gasprice-tfstate"
    key    = "terraform.tfstate"

    # Hetzner Object Storage (Falkenstein)
    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }
    region = "fsn1"

    # Hetzner Object Storage does not support these AWS features
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }
}
