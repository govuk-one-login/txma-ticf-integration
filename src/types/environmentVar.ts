export interface EnvironmentVar {
  name:
    | 'AWS_REGION'
    | 'ANALYSIS_BUCKET_NAME'
    | 'AUDIT_BUCKET_NAME'
    | 'ZENDESK_HOSTNAME'
    | 'ATHENA_DATABASE_NAME'
    | 'ATHENA_TABLE_NAME'
}
