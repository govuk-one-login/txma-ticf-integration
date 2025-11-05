#!/bin/bash

set -e  # Exit on any error

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
  --account-id 761029721660 \
  --no-confirmation-required \
  --client-request-token "backup-$(date +%s)" \
  --operation file://backup-operation.json \
  --manifest file://manifest-config.json \
  --role-arn arn:aws:iam::761029721660:role/txma-ticf-integration-build-batch-jobs-role \
  --priority 10 \
  --report file://report-config.json \
  --query 'JobId' --output text)

echo "Backup job created with ID: $BACKUP_JOB_ID"
