import {
  TEST_NOTIFY_SECRET_NAME,
  TEST_ANALYSIS_BUCKET,
  TEST_AUDIT_BUCKET,
  TEST_AWS_ACCOUNT_ID,
  TEST_BATCH_JOB_MANIFEST_BUCKET_ARN,
  TEST_BATCH_JOB_MANIFEST_BUCKET_NAME,
  TEST_BATCH_JOB_ROLE_ARN,
  TEST_ZENDESK_SECRET_NAME
} from '../testConstants'

import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../testConstants'

process.env.ANALYSIS_BUCKET_NAME = TEST_ANALYSIS_BUCKET
process.env.AUDIT_BUCKET_NAME = TEST_AUDIT_BUCKET
process.env.AWS_REGION = 'eu-west-2'
process.env.ATHENA_DATABASE_NAME = 'test_database'
process.env.ATHENA_TABLE_NAME = 'test_table'
process.env.DYNAMODB_TABLE_NAME = 'test_query_table'
process.env.ATHENA_WORKGROUP_NAME = 'test_query_workgroup'
process.env.ZENDESK_API_SECRETS_NAME = TEST_ZENDESK_SECRET_NAME
process.env.NOTIFY_API_SECRETS_NAME = TEST_NOTIFY_SECRET_NAME
process.env.INITIATE_DATA_REQUEST_QUEUE_URL =
  MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
process.env.BATCH_JOB_MANIFEST_BUCKET_ARN = TEST_BATCH_JOB_MANIFEST_BUCKET_ARN
process.env.BATCH_JOB_MANIFEST_BUCKET_NAME = TEST_BATCH_JOB_MANIFEST_BUCKET_NAME
process.env.ACCOUNT_ID = TEST_AWS_ACCOUNT_ID
process.env.BATCH_JOB_ROLE_ARN = TEST_BATCH_JOB_ROLE_ARN
