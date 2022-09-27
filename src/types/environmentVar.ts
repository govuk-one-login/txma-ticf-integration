export interface EnvironmentVar {
  name:
    | 'AWS_REGION'
    | 'ANALYSIS_BUCKET_NAME'
    | 'AUDIT_BUCKET_NAME'
    | 'ATHENA_DATABASE_NAME'
    | 'ATHENA_TABLE_NAME'
    | 'DYNAMODB_TABLE_NAME'
    | 'INITIATE_DATA_REQUEST_QUEUE_URL'
    | 'ZENDESK_API_SECRETS_NAME'
    | 'BATCH_JOB_MANIFEST_BUCKET_ARN'
    | 'BATCH_JOB_MANIFEST_BUCKET_NAME'
    | 'ACCOUNT_ID'
}
