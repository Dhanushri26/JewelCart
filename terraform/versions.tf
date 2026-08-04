terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # v6 supports the nodejs24.x runtime used by jewelcart-notification.
      version = "~> 6.0"
    }
  }
}
