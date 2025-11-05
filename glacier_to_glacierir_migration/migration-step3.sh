echo "Creating migration job (change to GLACIER_IR)..."
MIGRATE_JOB_ID=$(aws s3control create-job \
  --account-id 761029721660 \
  --no-confirmation-required \
  --client-request-token "migrate-$(date +%s)" \
  --operation file://migrate-operation.json \
  --manifest file://manifest-config.json \
  --role-arn arn:aws:iam::761029721660:role/txma-ticf-integration-build-batch-jobs-role \
  --priority 10 \
  --report file://report-config.json \
  --query 'JobId' --output text)

echo "Migration job created with ID: $MIGRATE_JOB_ID"
echo "Monitor jobs with:"
echo "  aws s3control describe-job --account-id 761029721660 --job-id $BACKUP_JOB_ID"
echo "  aws s3control describe-job --account-id 761029721660 --job-id $MIGRATE_JOB_ID"

# Check job status with:
# aws s3control describe-job --account-id 761029721660 --job-id <job-id>
