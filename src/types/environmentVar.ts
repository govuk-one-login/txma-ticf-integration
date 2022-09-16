export interface EnvironmentVar {
  name:
    | 'AWS_REGION'
    | 'ANALYSIS_BUCKET_NAME'
    | 'AUDIT_BUCKET_NAME'
    | 'INITIATE_DATA_REQUEST_QUEUE_URL'
    | 'ZENDESK_API_SECRETS_NAME'
}
