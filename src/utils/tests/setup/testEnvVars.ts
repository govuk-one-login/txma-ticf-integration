import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../testConstants'

process.env.ANALYSIS_BUCKET_NAME = 'analysis-bucket'
process.env.AUDIT_BUCKET_NAME = 'audit-bucket'
process.env.AWS_REGION = 'eu-west-2'
process.env.INITIATE_DATA_REQUEST_QUEUE_URL =
  MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
