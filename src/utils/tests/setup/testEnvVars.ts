import { TEST_ZENDESK_SECRET_NAME } from '../testConstants'

import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../testConstants'

process.env.ANALYSIS_BUCKET_NAME = 'analysis-bucket'
process.env.AUDIT_BUCKET_NAME = 'audit-bucket'
process.env.AWS_REGION = 'eu-west-2'
process.env.ATHENA_DATABASE_NAME = 'test_database'
process.env.ATHENA_TABLE_NAME = 'test_table'
process.env.DYNAMODB_TABLE_NAME = 'test_query_table'
process.env.ZENDESK_API_SECRETS_NAME = TEST_ZENDESK_SECRET_NAME
process.env.INITIATE_DATA_REQUEST_QUEUE_URL =
  MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
