module "lambda" {
  source    = "./modules/lambda"
  functions = var.lambda_functions
  tags      = local.required_tags
}

module "dynamodb" {
  source = "./modules/dynamodb"
  tables = var.dynamodb_tables
  tags   = local.required_tags
}

module "sqs" {
  source = "./modules/sqs"
  queues = var.sqs_queues
  tags   = local.required_tags
}

module "sns" {
  source = "./modules/sns"
  topics = var.sns_topics
  tags   = local.required_tags
}

module "s3" {
  source  = "./modules/s3"
  buckets = var.s3_buckets
  tags    = local.required_tags
}

module "iam" {
  source = "./modules/iam"
  roles  = var.iam_roles
  tags   = local.required_tags
}

module "apigateway" {
  source = "./modules/apigateway"
  api    = var.api_gateway
  tags   = local.required_tags
}
