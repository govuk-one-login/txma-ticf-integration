#!/bin/bash

set -e  # Exit on any error

# Configuration variables
ENVIRONMENT=${ENVIRONMENT:-build}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-761029721660}
SOURCE_BUCKET=${SOURCE_BUCKET:-audit-${ENVIRONMENT}-permanent-message-batch}
DEST_BUCKET=${DEST_BUCKET:-txma-ticf-integration-${ENVIRONMENT}-glac-mig-bucket}
PREFIX=${PREFIX:-}

echo "Using environment: $ENVIRONMENT"
echo "Using AWS account: $AWS_ACCOUNT_ID"
echo "Using source bucket: $SOURCE_BUCKET"
echo "Using destination bucket: $DEST_BUCKET"
if [ -n "$PREFIX" ]; then
    echo "Using prefix filter: $PREFIX"
else
    echo "No prefix filter (processing all objects)"
fi

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "Error: AWS credentials not configured or invalid"
    echo "Please run 'aws configure' or set up your AWS credentials"
    exit 1
fi

# Create manifest with proper CSV format (bucket,key)
echo "Creating manifest..."
echo "Listing objects with pagination for large buckets..."

# Initialize variables for multiple manifests
MANIFEST_COUNT=1
CURRENT_MANIFEST="glacier-backup-manifest-${MANIFEST_COUNT}.csv"
MAX_SIZE=$((900*1024*1024))  # 900MB to stay under 1GB limit
MANIFEST_FILES=()

# Initialize first manifest file
> "$CURRENT_MANIFEST"
MANIFEST_FILES+=("$CURRENT_MANIFEST")

# Use pagination to handle millions of objects
NEXT_TOKEN=""
OBJECT_COUNT=0

while true; do
    if [ -z "$NEXT_TOKEN" ]; then
        if [ -n "$PREFIX" ]; then
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --prefix "$PREFIX" \
                --query "{Contents: Contents[?StorageClass=='GLACIER'].Key, NextContinuationToken: NextContinuationToken}" \
                --output json)
        else
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --query "{Contents: Contents[?StorageClass=='GLACIER'].Key, NextContinuationToken: NextContinuationToken}" \
                --output json)
        fi
    else
        if [ -n "$PREFIX" ]; then
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --prefix "$PREFIX" \
                --continuation-token "$NEXT_TOKEN" \
                --query "{Contents: Contents[?StorageClass=='GLACIER'].Key, NextContinuationToken: NextContinuationToken}" \
                --output json)
        else
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --continuation-token "$NEXT_TOKEN" \
                --query "{Contents: Contents[?StorageClass=='GLACIER'].Key, NextContinuationToken: NextContinuationToken}" \
                --output json)
        fi
    fi
    
    # Extract objects and add to manifest
    OBJECTS=$(echo "$RESPONSE" | jq -r '.Contents[]? // empty')
    if [ -n "$OBJECTS" ]; then
        BATCH_DATA=$(echo "$OBJECTS" | sed "s/^/${SOURCE_BUCKET},/")
        
        # Check if adding this batch would exceed size limit
        CURRENT_SIZE=$(wc -c < "$CURRENT_MANIFEST")
        BATCH_SIZE=$(echo "$BATCH_DATA" | wc -c)
        
        if [ $((CURRENT_SIZE + BATCH_SIZE)) -gt $MAX_SIZE ] && [ $CURRENT_SIZE -gt 0 ]; then
            echo "Manifest $CURRENT_MANIFEST reached size limit ($CURRENT_SIZE bytes), creating new manifest"
            # Verify current manifest has content before creating new one
            if [ $CURRENT_SIZE -eq 0 ]; then
                echo "ERROR: Current manifest is empty but size limit reached. Batch too large."
                exit 1
            fi
            MANIFEST_COUNT=$((MANIFEST_COUNT + 1))
            CURRENT_MANIFEST="glacier-backup-manifest-${MANIFEST_COUNT}.csv"
            > "$CURRENT_MANIFEST"
            MANIFEST_FILES+=("$CURRENT_MANIFEST")
        fi
        
        echo "$BATCH_DATA" >> "$CURRENT_MANIFEST"
        BATCH_COUNT=$(echo "$OBJECTS" | wc -l)
        OBJECT_COUNT=$((OBJECT_COUNT + BATCH_COUNT))
        echo "Processed $BATCH_COUNT objects (total: $OBJECT_COUNT)"
    fi
    
    # Check for next token
    NEXT_TOKEN=$(echo "$RESPONSE" | jq -r '.NextContinuationToken // empty')
    if [ -z "$NEXT_TOKEN" ]; then
        break
    fi
done

echo "Total Glacier objects found: $OBJECT_COUNT"
echo "Created ${#MANIFEST_FILES[@]} manifest files"

# Validate total object count matches sum of all manifests
TOTAL_MANIFEST_LINES=0
for MANIFEST_FILE in "${MANIFEST_FILES[@]}"; do
    LINES=$(wc -l < "$MANIFEST_FILE")
    TOTAL_MANIFEST_LINES=$((TOTAL_MANIFEST_LINES + LINES))
done

if [ $TOTAL_MANIFEST_LINES -ne $OBJECT_COUNT ]; then
    echo "ERROR: Object count mismatch! Found $OBJECT_COUNT objects but manifests contain $TOTAL_MANIFEST_LINES lines"
    exit 1
fi
echo "Validation passed: All $OBJECT_COUNT objects accounted for in manifests"

# Upload manifests to S3 and collect ETags
echo "Uploading manifests to S3..."
ETAGS=()
for MANIFEST_FILE in "${MANIFEST_FILES[@]}"; do
    echo "Uploading $MANIFEST_FILE..."
    if ! aws s3 cp "$MANIFEST_FILE" s3://txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket/; then
        echo "Error: Failed to upload $MANIFEST_FILE to S3"
        exit 1
    fi
    
    # Get the ETag (remove quotes)
    ETAG=$(aws s3api head-object \
      --bucket txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket \
      --key "$MANIFEST_FILE" \
      --query 'ETag' --output text | tr -d '"')
    
    if [ -z "$ETAG" ]; then
        echo "Error: Failed to get ETag for $MANIFEST_FILE"
        exit 1
    fi
    
    ETAGS+=("$ETAG")
    echo "$MANIFEST_FILE uploaded with ETag: $ETAG"
done

# Create JSON config files
cat > restore-operation.json << EOF
{
  "S3InitiateRestoreObject": {
    "ExpirationInDays": 5,
    "GlacierJobTier": "BULK"
  }
}
EOF

cat > backup-operation.json << EOF
{
  "S3PutObjectCopy": {
    "TargetResource": "arn:aws:s3:::${DEST_BUCKET}",
    "StorageClass": "GLACIER"
  }
}
EOF

cat > migrate-operation.json << EOF
{
  "S3PutObjectCopy": {
    "TargetResource": "arn:aws:s3:::${SOURCE_BUCKET}",
    "StorageClass": "GLACIER_IR"
  }
}
EOF

# Create manifest config files for each manifest
for i in "${!MANIFEST_FILES[@]}"; do
    MANIFEST_FILE="${MANIFEST_FILES[$i]}"
    ETAG="${ETAGS[$i]}"
    CONFIG_FILE="manifest-config-$((i+1)).json"
    
    cat > "$CONFIG_FILE" << EOF
{
  "Spec": {
    "Format": "S3BatchOperations_CSV_20180820",
    "Fields": ["Bucket", "Key"]
  },
  "Location": {
    "ObjectArn": "arn:aws:s3:::txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket/$MANIFEST_FILE",
    "ETag": "$ETAG"
  }
}
EOF
done

cat > report-config.json << EOF
{
  "Enabled": true,
  "Bucket": "arn:aws:s3:::txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket",
  "Prefix": "reports",
  "Format": "Report_CSV_20180820",
  "ReportScope": "FailedTasksOnly"
}
EOF

cat > restore-report-config.json << EOF
{
  "Enabled": true,
  "Bucket": "arn:aws:s3:::txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket",
  "Prefix": "restore-reports",
  "Format": "Report_CSV_20180820",
  "ReportScope": "AllTasks"
}
EOF

# Save manifest files list for step 2
printf '%s\n' "${MANIFEST_FILES[@]}" > manifest-files.txt
echo "Manifest files list saved to manifest-files.txt"

# Display manifest information
for i in "${!MANIFEST_FILES[@]}"; do
    MANIFEST_FILE="${MANIFEST_FILES[$i]}"
    ETAG="${ETAGS[$i]}"
    LINE_COUNT=$(wc -l < "$MANIFEST_FILE")
    SIZE=$(wc -c < "$MANIFEST_FILE")
    echo "Manifest $((i+1)): $MANIFEST_FILE - $LINE_COUNT lines, $SIZE bytes, ETag: $ETAG"
done

# Create restore jobs for each manifest
echo "Creating restore jobs..."
RESTORE_JOB_IDS=()
for i in "${!MANIFEST_FILES[@]}"; do
    CONFIG_FILE="manifest-config-$((i+1)).json"
    
    RESTORE_JOB_ID=$(aws s3control create-job \
      --account-id $AWS_ACCOUNT_ID \
      --no-confirmation-required \
      --client-request-token "restore-$((i+1))-$(date +%s)" \
      --operation file://restore-operation.json \
      --manifest file://"$CONFIG_FILE" \
      --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
      --priority 10 \
      --report file://restore-report-config.json \
      --query 'JobId' --output text)
    
    RESTORE_JOB_IDS+=("$RESTORE_JOB_ID")
    echo "Restore job $((i+1)) created with ID: $RESTORE_JOB_ID"
done

echo "All restore jobs created. Wait for all to complete before running step2-create-backup.sh"
echo "IMPORTANT: Use run number $GITHUB_RUN_NUMBER for state_run_number parameter in subsequent steps"
echo "Check status with:"
for i in "${!RESTORE_JOB_IDS[@]}"; do
    echo "  aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id ${RESTORE_JOB_IDS[$i]}"
done

# Save job IDs for step 2
printf '%s\n' "${RESTORE_JOB_IDS[@]}" > restore-job-ids.txt
echo "Restore job IDs saved to restore-job-ids.txt"
