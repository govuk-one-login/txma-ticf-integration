import {
  TEST_NOTIFY_SECRET_NAME,
  TEST_ZENDESK_SECRET_NAME
} from '../testConstants'

process.env.ANALYSIS_BUCKET_NAME = 'analysis-bucket'
process.env.AUDIT_BUCKET_NAME = 'audit-bucket'
process.env.AWS_REGION = 'eu-west-2'
process.env.ZENDESK_API_SECRETS_NAME = TEST_ZENDESK_SECRET_NAME
process.env.NOTIFY_API_SECRETS_NAME = TEST_NOTIFY_SECRET_NAME
