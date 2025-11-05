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

# Create manifest with proper CSV format (bucket,key)
echo "Creating manifest..."
aws s3api list-objects-v2 \
  --bucket $SOURCE_BUCKET \
  --query 'Contents[?StorageClass==`GLACIER`].Key' \
  --output json | jq -r '.[]' | sed "s/^/${SOURCE_BUCKET},/" > glacier-backup-manifest.csv

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
