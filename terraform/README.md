# JewelCart AWS import project

This Terraform 1.6+ project manages the existing JewelCart resources in `ap-southeast-1`. It uses the AWS CLI SSO profile only—there are no access-key variables or credential files in this project. The provider is pinned to the AWS provider 5.x line.

## Prerequisites

- Terraform 1.6 or newer
- AWS CLI v2
- Access to the AWS Academy Lab account and its SSO start URL/region

## AWS SSO login

Create the required profile (choose the Academy account and role when prompted):

```bash
aws configure sso
# Enter Academy as the profile name.
aws sso login --profile Academy
```

Copy `terraform.tfvars.example` to `terraform.tfvars` and set the real cost centre. Never commit that file if it later contains sensitive ARNs, policies, or environment variable values.

```bash
terraform init
terraform plan
```

## Import existing resources

Run the supplied importer from this directory after SSO login:

```bash
bash import.sh
terraform plan
```

The script imports every resource whose import ID is known from the inventory. AWS does not expose enough information in the brief to safely guess API Gateway child IDs, subscriptions, IAM role names, or S3 subresource settings. Discover those IDs from the AWS console/CLI, add their real settings to `terraform.tfvars`, and use the documented examples at the bottom of `import.sh`.

After each import, run `terraform plan` and transcribe meaningful existing settings into the appropriate map. This prevents Terraform from replacing or changing an existing configuration. Lambda package locations and hashes are deliberately ignored so code deployments stay outside this infrastructure project.

Apply only after the plan contains no unexpected changes:

```bash
terraform apply
```

`terraform destroy` will attempt to delete every resource in state. Do **not** run it against this production-like import state unless deletion is explicitly intended.

## Layout

- Root files configure SSO-backed AWS access, shared tags, variables, outputs, and composition.
- `modules/lambda`, `dynamodb`, `sqs`, `sns`, `s3`, `apigateway`, and `iam` each manage their AWS service.
- `import.sh` imports the known resource inventory.

## Adding a resource

Add its configuration to the relevant root variable map, run the module-specific `terraform import` command using its real AWS ID, then run and review `terraform plan`. Keep `ApplicationService` and `CostCentre` as the only resource tags; the provider default-tags block enforces this project policy.
