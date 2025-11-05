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

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "Error: AWS credentials not configured or invalid"
    echo "Please run 'aws configure' or set up your AWS credentials"
    exit 1
fi

# Check if config files exist from step 1
if [ ! -f "manifest-config.json" ] || [ ! -f "report-config.json" ]; then
    echo "Error: Config files not found. Run migration-step1.sh first."
    exit 1
fi

echo "Creating backup job (copy to migration bucket)..."
BACKUP_JOB_ID=$(aws s3control create-job \
  --account-id $AWS_ACCOUNT_ID \
  --no-confirmation-required \
  --client-request-token "backup-$(date +%s)" \
  --operation file://backup-operation.json \
  --manifest file://manifest-config.json \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
  --priority 10 \
  --report file://report-config.json \
  --query 'JobId' --output text)

echo "Backup job created with ID: $BACKUP_JOB_ID"
