export type EnvironmentVar = {
  name:
    | 'AWS_REGION'
    | 'ANALYSIS_BUCKET_NAME'
    | 'AUDIT_BUCKET_NAME'
    | 'AUDIT_REQUEST_DYNAMODB_TABLE'
    | 'INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'
    | 'INITIATE_ATHENA_QUERY_QUEUE_URL'
    | 'INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'
    | 'DATA_PATHS'
    | 'DYNAMO_OPERATIONS_FUNCTION_NAME'
    | 'FIXED_DATA_REQUEST_DATE'
    | 'FIXED_RECIPIENT_EMAIL'
    | 'FIXED_SUBJECT_LINE'
    | 'NOTIFY_API_KEY'
    | 'OVERRIDE_EVENT_IDS'
    | 'PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'
    | 'QUERY_RESULTS_SECURE_DOWNLOAD_URL'
    | 'SECURE_DOWNLOAD_DYNAMODB_TABLE'
    | 'SQS_OPERATIONS_FUNCTION_NAME'
    | 'TEST_DATA_BUCKET_NAME'
    | 'ZENDESK_ADMIN_EMAIL'
    | 'ZENDESK_AGENT_EMAIL'
    | 'ZENDESK_API_KEY'
    | 'ZENDESK_END_USER_EMAIL'
    | 'ZENDESK_END_USER_NAME'
    | 'ZENDESK_HOSTNAME'
    | 'ZENDESK_RECIPIENT_EMAIL'
    | 'ZENDESK_RECIPIENT_NAME'
    | 'ZENDESK_WEBHOOK_API_BASE_URL'
    | 'ZENDESK_WEBHOOK_SECRET_KEY'
    | 'PERMANENT_AUDIT_BUCKET_NAME'
    | 'TEMPORARY_AUDIT_BUCKET_NAME'
    | 'DATA_READY_FOR_QUERY_LAMBDA_LOG_GROUP_NAME'
    | 'ATHENA_OUTPUT_BUCKET_NAME'
    | 'S3_READ_FILE_FUNCTION_NAME'
    | 'CHECK_S3_FILE_EXISTS_FUNCTION_NAME'
    | 'COPY_S3_FILE_FUNCTION_NAME'
}
