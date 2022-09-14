export interface EnvironmentVar {
  name:
    | 'AWS_REGION'
    | 'ANALYSIS_BUCKET_NAME'
    | 'AUDIT_BUCKET_NAME'
    | 'ZENDESK_HOSTNAME'
    | 'INITIATE_DATA_REQUEST_QUEUE_URL'
}
