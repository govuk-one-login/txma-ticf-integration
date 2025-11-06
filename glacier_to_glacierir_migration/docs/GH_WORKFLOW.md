# Migration Scripts GitHub Workflow

This document describes how to run migration scripts through GitHub Actions with full audit logging.

## Overview

The migration workflow allows you to run `migration-step*.sh` scripts remotely via GitHub Actions with:

- Parameter input validation
- Complete audit logging
- Artifact preservation
- AWS credential management

## Running Migration Scripts

### Via GitHub Actions (Recommended)

1. Go to the **Actions** tab in the GitHub repository
2. Select **Run Migration Scripts** workflow
3. Click **Run workflow**
4. Fill in the required parameters:
   - **Script name**: Choose from step1-initiate-restore.sh, step2-create-backup.sh, or step3-migrate.sh
   - **Environment**: build, staging, or production
   - **AWS Account ID**: (optional override)
   - **Source bucket**: (optional override)
   - **Destination bucket**: (optional override)
   - **Prefix**: (optional filter for objects)
   - **State run number**: (required for step2/step3 - use run number from step1)

### Via Local Execution

For testing or development, you can run scripts locally:

```bash
# Using npm scripts
npm run migration:step1 -- --environment build
npm run migration:step2 -- --environment staging --prefix 2024/
npm run migration:step3 -- --environment production

# Using the wrapper script directly
glacier_to_glacierir_migration/run-migration.sh step1-initiate-restore.sh --environment build --prefix 2024/01/
```

## Parameters

| Parameter        | Description             | Required             | Default        |
| ---------------- | ----------------------- | -------------------- | -------------- |
| script_name      | Migration script to run | Yes                  | -              |
| environment      | Target environment      | Yes                  | build          |
| aws_account_id   | AWS Account ID          | No                   | Script default |
| source_bucket    | Source S3 bucket        | No                   | Script default |
| dest_bucket      | Destination S3 bucket   | No                   | Script default |
| prefix           | Object prefix filter    | No                   | -              |
| state_run_number | Run number from step1   | No (Yes for step2/3) | -              |

## Audit Logging

Every execution creates comprehensive audit logs containing:

- **Execution metadata**: timestamp, user, run ID, repository info
- **Parameters**: all input parameters and their values
- **AWS context**: account ID, assumed role ARN
- **Script output**: complete stdout/stderr from script execution
- **Exit status**: success/failure indication

### Audit Log Artifacts

- **migration-audit-log-{run_number}**: Complete execution log (90-day retention)
- **migration-files-{run_number}**: Generated JSON/CSV files (30-day retention)

## Security

### Required Secrets

The workflow requires the following repository secret:

- `GH_ACTIONS_MIGRATION_ROLE_ARN`: IAM role ARN for migration operations

### Permissions

The workflow uses:

- `id-token: write` for OIDC authentication
- `contents: read` for repository access

### AWS Role Requirements

The migration role must have permissions for:

- S3 operations (list, get, put, copy)
- S3 Control batch operations
- STS assume role operations

## Migration Process

### Step 1: Create Manifest and Restore Job

```bash
# Creates manifest of Glacier objects and initiates restore
npm run migration:step1 -- --environment build
```

### Step 2: Create Backup Job

```bash
# Creates backup copies in migration bucket
npm run migration:step2 -- --environment build
```

### Step 3: Create Migration Job

```bash
# Migrates objects to Glacier IR storage class
npm run migration:step3 -- --environment build
```

## Monitoring

### Job Status Checking

After running scripts, monitor AWS batch job status:

```bash
aws s3control describe-job --account-id {account-id} --job-id {job-id}
```

### GitHub Actions Logs

- View real-time execution in the Actions tab
- Download audit logs from the Artifacts section
- Check job status and duration in the workflow summary

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure the migration role is properly configured
2. **Bucket Access**: Verify the role has access to source and destination buckets
3. **Manifest Size**: Large manifests (>1GB) may need to be split
4. **Job Limits**: AWS has limits on concurrent batch operations

### Error Recovery

- Check audit logs for detailed error messages
- Verify AWS permissions and bucket configurations
- Re-run failed steps after addressing issues
- Use prefix filters to process smaller batches if needed

## Best Practices

1. **Test First**: Always test in build environment before production
2. **Use Prefixes**: Filter objects by date/prefix for manageable batches
3. **Monitor Progress**: Check batch job status regularly
4. **Backup Verification**: Verify backup completion before running step 3
5. **Audit Trail**: Keep audit logs for compliance and troubleshooting

## Examples

### Basic Migration

```bash
# Step 1: Create manifest and restore
npm run migration:step1 -- --environment build

# Wait for restore completion, then:
# Step 2: Create backup
npm run migration:step2 -- --environment build

# Wait for backup completion, then:
# Step 3: Migrate to Glacier IR
npm run migration:step3 -- --environment build
```

### Filtered Migration

```bash
# Migrate only objects from January 2024
npm run migration:step1 -- --environment build --prefix 2024/01/
npm run migration:step2 -- --environment build
npm run migration:step3 -- --environment build
```

### Production Migration

```bash
# Production migration with custom buckets
glacier_to_glacierir_migration/run-migration.sh step1-initiate-restore.sh \
  --environment production \
  --aws-account-id 123456789012 \
  --source-bucket custom-source-bucket \
  --dest-bucket custom-dest-bucket
```
