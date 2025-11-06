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

# Check if config files exist from previous steps
if [ ! -f "manifest-files.txt" ]; then
    echo "Error: manifest-files.txt not found. Run migration-step1.sh first."
    exit 1
fi

# Read manifest files list
readarray -t MANIFEST_FILES < manifest-files.txt

echo "Creating migration jobs (change to GLACIER_IR)..."
MIGRATE_JOB_IDS=()
for i in "${!MANIFEST_FILES[@]}"; do
    CONFIG_FILE="manifest-config-$((i+1)).json"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "Error: $CONFIG_FILE not found. Run migration-step1.sh first."
        exit 1
    fi
    
    MIGRATE_JOB_ID=$(aws s3control create-job \
      --account-id $AWS_ACCOUNT_ID \
      --no-confirmation-required \
      --client-request-token "migrate-$((i+1))-$(date +%s)" \
      --operation file://migrate-operation.json \
      --manifest file://"$CONFIG_FILE" \
      --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
      --priority 10 \
      --report file://report-config.json \
      --query 'JobId' --output text)
    
    MIGRATE_JOB_IDS+=("$MIGRATE_JOB_ID")
    echo "Migration job $((i+1)) created with ID: $MIGRATE_JOB_ID"
done

echo "All migration jobs created. Monitor with:"
if [ -f "backup-job-ids.txt" ]; then
    echo "Backup jobs:"
    while IFS= read -r job_id; do
        echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id $job_id"
    done < backup-job-ids.txt
fi

echo "Migration jobs:"
for i in "${!MIGRATE_JOB_IDS[@]}"; do
    echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id ${MIGRATE_JOB_IDS[$i]}"
done

# Save job IDs
printf '%s\n' "${MIGRATE_JOB_IDS[@]}" > migrate-job-ids.txt
echo "Migration job IDs saved to migrate-job-ids.txt"
