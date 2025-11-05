#!/bin/bash

set -e  # Exit on any error

# Configuration variables
ENVIRONMENT=${ENVIRONMENT:-build}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-761029721660}
SOURCE_BUCKET=${SOURCE_BUCKET:-audit-${ENVIRONMENT}-permanent-message-batch}
DEST_BUCKET=${DEST_BUCKET:-txma-ticf-integration-${ENVIRONMENT}-glac-mig-bucket}

echo "Using environment: $ENVIRONMENT"
echo "Using AWS account: $AWS_ACCOUNT_ID"
echo "Using source bucket: $SOURCE_BUCKET"
echo "Using destination bucket: $DEST_BUCKET"

echo "Creating migration job (change to GLACIER_IR)..."
MIGRATE_JOB_ID=$(aws s3control create-job \
  --account-id $AWS_ACCOUNT_ID \
  --no-confirmation-required \
  --client-request-token "migrate-$(date +%s)" \
  --operation file://migrate-operation.json \
  --manifest file://manifest-config.json \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
  --priority 10 \
  --report file://report-config.json \
  --query 'JobId' --output text)

echo "Migration job created with ID: $MIGRATE_JOB_ID"
echo "Monitor jobs with:"
echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id \$BACKUP_JOB_ID"
echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id $MIGRATE_JOB_ID"

# Check job status with:
# aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id <job-id>
