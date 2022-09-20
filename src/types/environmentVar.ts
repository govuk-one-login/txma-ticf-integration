export interface EnvironmentVar {
  name:
    | 'AWS_REGION'
    | 'ANALYSIS_BUCKET_NAME'
    | 'AUDIT_BUCKET_NAME'
    | 'ZENDESK_API_SECRETS_NAME'
    | 'NOTIFY_API_SECRETS_NAME'
}
