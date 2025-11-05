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

# Initialize manifest file
> glacier-backup-manifest.csv

# Use pagination to handle millions of objects
NEXT_TOKEN=""
OBJECT_COUNT=0

while true; do
    if [ -z "$NEXT_TOKEN" ]; then
        if [ -n "$PREFIX" ]; then
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --prefix "$PREFIX" \
                --query '{Contents: Contents[?StorageClass==`GLACIER`].Key, NextContinuationToken: NextContinuationToken}' \
                --output json)
        else
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --query '{Contents: Contents[?StorageClass==`GLACIER`].Key, NextContinuationToken: NextContinuationToken}' \
                --output json)
        fi
    else
        if [ -n "$PREFIX" ]; then
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --prefix "$PREFIX" \
                --continuation-token "$NEXT_TOKEN" \
                --query '{Contents: Contents[?StorageClass==`GLACIER`].Key, NextContinuationToken: NextContinuationToken}' \
                --output json)
        else
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --continuation-token "$NEXT_TOKEN" \
                --query '{Contents: Contents[?StorageClass==`GLACIER`].Key, NextContinuationToken: NextContinuationToken}' \
                --output json)
        fi
    fi
    
    # Extract objects and add to manifest
    OBJECTS=$(echo "$RESPONSE" | jq -r '.Contents[]? // empty')
    if [ -n "$OBJECTS" ]; then
        echo "$OBJECTS" | sed "s/^/${SOURCE_BUCKET},/" >> glacier-backup-manifest.csv
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

# Upload manifest to S3
echo "Uploading manifest to S3..."
if ! aws s3 cp glacier-backup-manifest.csv s3://txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket/; then
    echo "Error: Failed to upload manifest to S3"
    exit 1
fi

# Get the ETag (remove quotes)
echo "Getting ETag..."
ETAG=$(aws s3api head-object \
  --bucket txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket \
  --key glacier-backup-manifest.csv \
  --query 'ETag' --output text | tr -d '"')

if [ -z "$ETAG" ]; then
    echo "Error: Failed to get ETag for uploaded file"
    exit 1
fi

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

cat > manifest-config.json << EOF
{
  "Spec": {
    "Format": "S3BatchOperations_CSV_20180820",
    "Fields": ["Bucket", "Key"]
  },
  "Location": {
    "ObjectArn": "arn:aws:s3:::txma-data-analysis-${ENVIRONMENT}-batch-job-manifest-bucket/glacier-backup-manifest.csv",
    "ETag": "$ETAG"
  }
}
EOF

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
  "Enabled": false
}
EOF

echo "ETag: $ETAG"
echo "Manifest line count: $(wc -l < glacier-backup-manifest.csv)"

# Check if manifest is too large for S3 batch operations
MANIFEST_SIZE=$(wc -c < glacier-backup-manifest.csv)
MAX_SIZE=$((1024*1024*1024))  # 1GB limit for S3 batch operations manifest

if [ $MANIFEST_SIZE -gt $MAX_SIZE ]; then
    echo "WARNING: Manifest size ($MANIFEST_SIZE bytes) exceeds S3 batch operations limit (1GB)"
    echo "Consider splitting the migration into smaller batches"
    echo "You may need to filter objects by prefix or date range"
fi

echo "Creating restore job..."
RESTORE_JOB_ID=$(aws s3control create-job \
  --account-id $AWS_ACCOUNT_ID \
  --no-confirmation-required \
  --client-request-token "restore-$(date +%s)" \
  --operation file://restore-operation.json \
  --manifest file://manifest-config.json \
  --role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/txma-ticf-integration-${ENVIRONMENT}-batch-jobs-role \
  --priority 10 \
  --report file://restore-report-config.json \
  --query 'JobId' --output text)

echo "Restore job created with ID: $RESTORE_JOB_ID"
echo "Wait for restore to complete before running migration-step2.sh"
echo "Check status with: aws s3control describe-job --account-id $AWS_ACCOUNT_ID --job-id $RESTORE_JOB_ID"
