resource "aws_iam_role" "this" {
  for_each           = var.roles
  name               = each.key
  assume_role_policy = each.value.assume_role_policy
  description        = try(each.value.description, null)
  tags               = var.tags
}
