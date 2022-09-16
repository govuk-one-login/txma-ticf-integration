import {
  TEST_ANALYSIS_BUCKET,
  TEST_AUDIT_BUCKET,
  TEST_ZENDESK_SECRET_NAME
} from '../testConstants'

import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../testConstants'

process.env.ANALYSIS_BUCKET_NAME = TEST_ANALYSIS_BUCKET
process.env.AUDIT_BUCKET_NAME = TEST_AUDIT_BUCKET
process.env.AWS_REGION = 'eu-west-2'
process.env.ZENDESK_API_SECRETS_NAME = TEST_ZENDESK_SECRET_NAME
process.env.INITIATE_DATA_REQUEST_QUEUE_URL =
  MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
