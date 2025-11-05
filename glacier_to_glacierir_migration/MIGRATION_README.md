# Glacier Migration Scripts and Utilities

This document explains the migration scripts and utilities for moving data from Glacier to Glacier Instant Retrieval storage class.

## Overview

The migration process consists of three sequential steps:

1. **Step 1**: Create manifest and initiate restore from Glacier
2. **Step 2**: Create backup copy in migration bucket
3. **Step 3**: Migrate to Glacier Instant Retrieval storage class

Additionally, a utility script is provided for decrypting and decompressing retrieved data.

## Migration Scripts

### migration-step1.sh

**Purpose**: Creates a manifest of all Glacier objects and initiates restore operation.

**What it does**:

- Lists all objects in Glacier storage class from `audit-build-permanent-message-batch` bucket
- Creates a CSV manifest file with bucket,key format
- Uploads manifest to S3 batch operations bucket
- Creates JSON configuration files for subsequent operations
- Initiates S3 batch restore job with 5-day expiration and BULK tier

**Prerequisites**:

- AWS credentials configured for build account
- Access to `audit-build-permanent-message-batch` bucket
- Access to `txma-data-analysis-build-batch-job-manifest-bucket` bucket

**Usage**:

```bash
./migration-step1.sh
```

**Output**:

- `glacier-backup-manifest.csv` - List of objects to migrate
- Various JSON config files for batch operations
- Restore job ID for monitoring

### migration-step2.sh

**Purpose**: Creates backup copies of restored objects in the migration bucket.

**What it does**:

- Uses the manifest created in Step 1
- Creates S3 batch copy job to backup objects to `txma-ticf-integration-build-glac-mig-bucket`
- Copies objects with Glacier storage class

**Prerequisites**:

- Step 1 must be completed successfully
- Restore job from Step 1 must be finished
- Config files from Step 1 must exist

**Usage**:

```bash
./migration-step2.sh
```

**Output**:

- Backup job ID for monitoring

### migration-step3.sh

**Purpose**: Migrates objects to Glacier Instant Retrieval storage class.

**What it does**:

- Creates S3 batch copy job to change storage class to `GLACIER_IR`
- Updates objects in the original bucket with new storage class

**Prerequisites**:

- Steps 1 and 2 must be completed successfully
- Config files from Step 1 must exist

**Usage**:

```bash
./migration-step3.sh
```

**Output**:

- Migration job ID for monitoring
- Commands to check job status

## Utility Scripts

### decrypt-and-decompress.js

**Purpose**: Decrypts and decompresses data retrieved from Glacier storage.

**What it does**:

- Uses AWS KMS to decrypt encrypted data
- Decompresses gzipped content
- Outputs plain text data to specified file

**Prerequisites**:

- Node.js installed
- AWS credentials configured (uses `audit-build` profile)
- Required npm packages: `@aws-crypto/decrypt-node`, `@aws-crypto/kms-keyring-node`

**Usage**:

```bash
node decrypt-and-decompress.mjs <input-file> <output-file> <kms-key-id>
```

**Example**:

```bash
node decrypt-and-decompress.mjs glacier-ir-test.gz decrypted-content.txt arn:aws:kms:eu-west-2:123456789:key/your-key-id
```

**Note**: Use the `.mjs` version to avoid ESLint issues with ES6 imports. The `.js` version uses CommonJS require statements.

**Getting the KMS Key ARN**:

```bash
aws ssm get-parameter --name "S3EncryptionGeneratorKmsKeyArn" --region eu-west-2 --profile audit-build
```

**Tested Command**:

```bash
node decrypt-and-decompress.mjs glacier-ir-test.gz test-output.txt arn:aws:kms:eu-west-2:761029721660:key/6c48649a-8d47-4e23-b8d0-1725d020a92c
```

**Parameters**:

- `input-file`: Path to encrypted/compressed file
- `output-file`: Path where decrypted content will be saved
- `kms-key-id`: ARN of KMS key used for encryption

## Complete Migration Workflow

### Environment Configuration

Set environment variables before running scripts:

```bash
export ENVIRONMENT=build  # or dev, staging, production
export AWS_ACCOUNT_ID=761029721660  # your AWS account ID
export SOURCE_BUCKET=audit-build-permanent-message-batch  # source bucket name
export DEST_BUCKET=txma-ticf-integration-build-glac-mig-bucket  # destination bucket name
```

Or run with inline variables:

```bash
ENVIRONMENT=staging AWS_ACCOUNT_ID=123456789012 SOURCE_BUCKET=my-source-bucket DEST_BUCKET=my-dest-bucket ./migration-step1.sh
```

### Migration Steps

1. **Run Step 1**:

   ```bash
   ./migration-step1.sh
   ```

   Wait for restore job to complete (check status with provided command).

2. **Run Step 2**:

   ```bash
   ./migration-step2.sh
   ```

   Wait for backup job to complete.

3. **Run Step 3**:

   ```bash
   ./migration-step3.sh
   ```

   Monitor migration job completion.

4. **Get KMS Key ARN**:

   ```bash
   aws ssm get-parameter --name "S3EncryptionGeneratorKmsKeyArn" --region eu-west-2 --profile audit-${ENVIRONMENT}
   ```

5. **Verify and test** (decrypt a file):
   ```bash
   node decrypt-and-decompress.mjs glacier-ir-test.gz test-output.txt arn:aws:kms:eu-west-2:761029721660:key/6c48649a-8d47-4e23-b8d0-1725d020a92c
   ```

## Monitoring Jobs

Check job status using:

```bash
aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id <job-id>
```

List all jobs:

```bash
aws s3control list-jobs --account-id $AWS_ACCOUNT_ID
```

## Scalability Considerations

### Large Scale Migrations (Millions of Objects)

The scripts include pagination logic to handle millions of objects, but be aware of these limitations:

**S3 Batch Operations Limits:**

- Maximum manifest file size: 1GB
- Maximum objects per job: 1 billion
- Recommended batch size: 1-10 million objects per job

**For Very Large Migrations:**

1. **Split by prefix**: Filter objects by date/prefix to create smaller batches
2. **Monitor manifest size**: Script warns if manifest exceeds 1GB
3. **Use multiple jobs**: Run separate migrations for different object groups

**Example - Split by Date Prefix:**

```bash
# Process objects with specific prefix
PREFIX="2023/01/" ./migration-step1.sh
PREFIX="2023/02/" ./migration-step1.sh
PREFIX="2024/" ./migration-step1.sh

# Or set as environment variable
export PREFIX="firehose/2023/"
./migration-step1.sh
```

## Important Notes

- Each step must complete successfully before proceeding to the next
- Restore jobs have a 5-day expiration period
- All scripts require proper AWS credentials for the target environment account
- The migration creates backup copies before changing storage classes
- Monitor job progress to ensure successful completion before proceeding
- Set ENVIRONMENT, AWS_ACCOUNT_ID, SOURCE_BUCKET, DEST_BUCKET, and PREFIX variables for different environments
- Default values: ENVIRONMENT=build, AWS_ACCOUNT_ID=761029721660
- Default SOURCE_BUCKET: audit-${ENVIRONMENT}-permanent-message-batch
- Default DEST_BUCKET: txma-ticf-integration-${ENVIRONMENT}-glac-mig-bucket
- Optional PREFIX: Filter objects by prefix (empty = all objects)
- Scripts use pagination to handle millions of objects automatically
- Large manifests (>1GB) will trigger warnings and may need to be split
