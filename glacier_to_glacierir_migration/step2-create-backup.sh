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
if [ ! -f "manifest-files.txt" ] || [ ! -f "report-config.json" ]; then
    echo "Error: Config files not found. Run step1-initiate-restore.sh first."
    exit 1
fi

# Read manifest files list
readarray -t MANIFEST_FILES < manifest-files.txt

echo "Creating backup jobs (copy to migration bucket)..."
BACKUP_JOB_IDS=()
for i in "${!MANIFEST_FILES[@]}"; do
    CONFIG_FILE="manifest-config-$((i+1)).json"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "Error: $CONFIG_FILE not found. Run step1-initiate-restore.sh first."
        exit 1
    fi
    
    BACKUP_JOB_ID=$(aws s3control create-job \
      --account-id $AWS_ACCOUNT_ID \
      --no-confirmation-required \
      --client-request-token "backup-$((i+1))-$(date +%s)" \
      --operation file://backup-operation.json \
      --manifest file://"$CONFIG_FILE" \
      --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
      --priority 10 \
      --report file://report-config.json \
      --query 'JobId' --output text)
    
    BACKUP_JOB_IDS+=("$BACKUP_JOB_ID")
    echo "Backup job $((i+1)) created with ID: $BACKUP_JOB_ID"
done

echo "All backup jobs created. Monitor with:"
for i in "${!BACKUP_JOB_IDS[@]}"; do
    echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id ${BACKUP_JOB_IDS[$i]}"
done

# Save job IDs for step 3
printf '%s\n' "${BACKUP_JOB_IDS[@]}" > backup-job-ids.txt
echo "Backup job IDs saved to backup-job-ids.txt"
