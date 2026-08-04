locals {
  # Deliberately limited to the two tags approved for this account.
  required_tags = {
    ApplicationService = var.application_service
    CostCentre         = var.cost_centre
  }
}
