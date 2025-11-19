#!/bin/bash

set -e  # Exit on any error

# Configuration variables
ENVIRONMENT=${ENVIRONMENT:-build}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-761029721660}
SOURCE_BUCKET=${SOURCE_BUCKET:-audit-${ENVIRONMENT}-permanent-message-batch}
DEST_BUCKET=${DEST_BUCKET:-txma-ticf-integration-${ENVIRONMENT}-glac-mig-bucket}
ETAG_OVERRIDE=${ETAG_OVERRIDE:-}
BUCKET_SUFFIX=$(echo "$SOURCE_BUCKET" | sed 's/audit-[^-]*-//' | tr '-' '_')

echo "Using environment: $ENVIRONMENT"
echo "Using AWS account: $AWS_ACCOUNT_ID"
echo "Using source bucket: $SOURCE_BUCKET"
echo "Using destination bucket: $DEST_BUCKET"
if [ -n "$ETAG_OVERRIDE" ]; then
    echo "Using ETag override: $ETAG_OVERRIDE"
fi

# Check if config files exist from previous steps
if [ ! -f "manifest-files-${BUCKET_SUFFIX}.txt" ]; then
    echo "Error: manifest-files-${BUCKET_SUFFIX}.txt not found. Run step1-initiate-restore.sh first."
    exit 1
fi

# Read manifest files list
readarray -t MANIFEST_FILES < manifest-files-${BUCKET_SUFFIX}.txt

echo "Creating migration jobs (change to GLACIER_IR)..."
MIGRATE_JOB_IDS=()
for i in "${!MANIFEST_FILES[@]}"; do
    CONFIG_FILE="manifest-config-${BUCKET_SUFFIX}-$((i+1)).json"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "Error: $CONFIG_FILE not found. Run step1-initiate-restore.sh first."
        exit 1
    fi
    
    # Override ETag in manifest config if provided
    if [ -n "$ETAG_OVERRIDE" ]; then
        echo "Overriding ETag in $CONFIG_FILE with: $ETAG_OVERRIDE"
        jq --arg etag "$ETAG_OVERRIDE" '.Location.ETag = $etag' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    fi
    
    MIGRATE_JOB_ID=$(aws s3control create-job \
      --account-id $AWS_ACCOUNT_ID \
      --no-confirmation-required \
      --client-request-token "migrate-$((i+1))-$(date +%s)" \
      --operation file://migrate-operation-${BUCKET_SUFFIX}.json \
      --manifest file://"$CONFIG_FILE" \
      --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
      --priority 10 \
      --report file://report-config-${BUCKET_SUFFIX}.json \
      --query 'JobId' --output text)
    
    MIGRATE_JOB_IDS+=("$MIGRATE_JOB_ID")
    echo "Migration job $((i+1)) created with ID: $MIGRATE_JOB_ID"
done

echo "All migration jobs created. Monitor with:"
if [ -f "backup-job-ids-${BUCKET_SUFFIX}.txt" ]; then
    echo "Backup jobs:"
    while IFS= read -r job_id; do
        echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id $job_id"
    done < backup-job-ids-${BUCKET_SUFFIX}.txt
fi

echo "Migration jobs:"
for i in "${!MIGRATE_JOB_IDS[@]}"; do
    echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id ${MIGRATE_JOB_IDS[$i]}"
done

# Save job IDs
printf '%s\n' "${MIGRATE_JOB_IDS[@]}" > migrate-job-ids-${BUCKET_SUFFIX}.txt
echo "Migration job IDs saved to migrate-job-ids-${BUCKET_SUFFIX}.txt"
