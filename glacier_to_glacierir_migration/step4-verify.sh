#!/bin/bash

set -e  # Exit on any error

# Configuration variables
ENVIRONMENT=${ENVIRONMENT:-build}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-761029721660}
SOURCE_BUCKET=${SOURCE_BUCKET:-audit-${ENVIRONMENT}-permanent-message-batch}
PREFIX=${PREFIX:-}

echo "=== MIGRATION VERIFICATION ==="
echo "Environment: $ENVIRONMENT"
echo "Source bucket: $SOURCE_BUCKET"
echo "Prefix: ${PREFIX:-'(all objects)'}"
echo "=============================="

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "Error: AWS credentials not configured or invalid"
    exit 1
fi

# Count objects by storage class
echo "Counting objects by storage class..."

NEXT_TOKEN=""
GLACIER_COUNT=0
GLACIER_IR_COUNT=0
STANDARD_COUNT=0
OTHER_COUNT=0

while true; do
    if [ -z "$NEXT_TOKEN" ]; then
        if [ -n "$PREFIX" ]; then
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --prefix "$PREFIX" \
                --query "{Contents: Contents[].{Key: Key, StorageClass: StorageClass}, NextContinuationToken: NextContinuationToken}" \
                --output json)
        else
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --query "{Contents: Contents[].{Key: Key, StorageClass: StorageClass}, NextContinuationToken: NextContinuationToken}" \
                --output json)
        fi
    else
        if [ -n "$PREFIX" ]; then
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --prefix "$PREFIX" \
                --continuation-token "$NEXT_TOKEN" \
                --query "{Contents: Contents[].{Key: Key, StorageClass: StorageClass}, NextContinuationToken: NextContinuationToken}" \
                --output json)
        else
            RESPONSE=$(aws s3api list-objects-v2 \
                --bucket $SOURCE_BUCKET \
                --continuation-token "$NEXT_TOKEN" \
                --query "{Contents: Contents[].{Key: Key, StorageClass: StorageClass}, NextContinuationToken: NextContinuationToken}" \
                --output json)
        fi
    fi

    # Count objects by storage class
    GLACIER_BATCH=$(echo "$RESPONSE" | jq -r '.Contents[]? | select(.StorageClass == "GLACIER") | .Key' | wc -l)
    GLACIER_IR_BATCH=$(echo "$RESPONSE" | jq -r '.Contents[]? | select(.StorageClass == "GLACIER_IR") | .Key' | wc -l)
    STANDARD_BATCH=$(echo "$RESPONSE" | jq -r '.Contents[]? | select(.StorageClass == "STANDARD" or .StorageClass == null) | .Key' | wc -l)
    OTHER_BATCH=$(echo "$RESPONSE" | jq -r '.Contents[]? | select(.StorageClass != "GLACIER" and .StorageClass != "GLACIER_IR" and .StorageClass != "STANDARD" and .StorageClass != null) | .Key' | wc -l)
    
    GLACIER_COUNT=$((GLACIER_COUNT + GLACIER_BATCH))
    GLACIER_IR_COUNT=$((GLACIER_IR_COUNT + GLACIER_IR_BATCH))
    STANDARD_COUNT=$((STANDARD_COUNT + STANDARD_BATCH))
    OTHER_COUNT=$((OTHER_COUNT + OTHER_BATCH))
    
    TOTAL_BATCH=$((GLACIER_BATCH + GLACIER_IR_BATCH + STANDARD_BATCH + OTHER_BATCH))
    if [ $TOTAL_BATCH -gt 0 ]; then
        echo "Processed $TOTAL_BATCH objects (GLACIER: $GLACIER_COUNT, GLACIER_IR: $GLACIER_IR_COUNT, STANDARD: $STANDARD_COUNT, OTHER: $OTHER_COUNT)"
    fi

    # Check for next token
    NEXT_TOKEN=$(echo "$RESPONSE" | jq -r '.NextContinuationToken // empty')
    if [ -z "$NEXT_TOKEN" ]; then
        break
    fi
done

TOTAL_COUNT=$((GLACIER_COUNT + GLACIER_IR_COUNT + STANDARD_COUNT + OTHER_COUNT))

echo ""
echo "=== MIGRATION VERIFICATION RESULTS ==="
echo "Total objects: $TOTAL_COUNT"
echo "GLACIER objects (not migrated): $GLACIER_COUNT"
echo "GLACIER_IR objects (migrated): $GLACIER_IR_COUNT"
echo "STANDARD objects: $STANDARD_COUNT"
echo "Other storage classes: $OTHER_COUNT"
echo ""

if [ $GLACIER_COUNT -eq 0 ]; then
    echo "✅ MIGRATION COMPLETE: All GLACIER objects have been migrated to GLACIER_IR"
    exit 0
else
    echo "❌ MIGRATION INCOMPLETE: $GLACIER_COUNT objects still in GLACIER storage class"
    echo "Migration progress: $(( (GLACIER_IR_COUNT * 100) / (GLACIER_COUNT + GLACIER_IR_COUNT) ))% complete"
    exit 1
fi
