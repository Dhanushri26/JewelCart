variable "aws_region" {
  type        = string
  description = "AWS region hosting JewelCart."
  default     = "ap-southeast-1"
}

variable "aws_profile" {
  type        = string
  description = "AWS CLI SSO profile name."
  default     = "Academy"
}

variable "application_service" {
  type        = string
  description = "Value for the ApplicationService tag."
}

variable "cost_centre" {
  type        = string
  description = "Value for the CostCentre tag."
}

variable "lambda_functions" {
  type        = any
  description = "Existing Lambda functions keyed by name. Add their observed configuration before apply."
  default = {
    "JewelCart-cart"         = {}
    "JewelCart-products"     = {}
    "JewelCart-inventory"    = {}
    "JewelCart-payment"      = {}
    "JewelCart-order"        = {}
    "jewelcart-notification" = {}
  }
}

variable "dynamodb_tables" {
  type        = any
  description = "Existing DynamoDB tables keyed by name."
  default = {
    "jewelcart-cart"      = {}
    "jewelcart-inventory" = {}
    "jewelcart-orders"    = {}
    "jewelcart-payments"  = {}
    "jewelcart-products"  = {}
    "jewelcart-users" = {
      billing_mode = "PAY_PER_REQUEST"
      hash_key     = "PK"
      range_key    = "SK"
      attributes = [
        { name = "PK", type = "S" },
        { name = "SK", type = "S" },
      ]
    }
  }
}

variable "sqs_queues" {
  type        = any
  description = "Existing SQS queues keyed by name."
  default     = { "jewelcart-order-queue" = {} }
}

variable "sns_topics" {
  type        = any
  description = "Existing SNS topics keyed by name."
  default     = { "jewelcart-payment-topic" = {} }
}

variable "s3_buckets" {
  type        = any
  description = "Existing S3 buckets keyed by name."
  default     = { "jewelcart-frontend-dhanu" = {}, "jewelcart-invoices-dhanu26" = {} }
}

variable "api_gateway" {
  type        = any
  description = "Existing REST API configuration."
  default     = { name = "JewelCart-v1-api" }
}

variable "iam_roles" {
  type        = any
  description = "Existing IAM roles keyed by name."
  default     = {}
}
