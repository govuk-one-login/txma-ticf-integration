import { getEnv } from '../utils/helpers'

export const ANALYSIS_BUCKET_NAME = getEnv('ANALYSIS_BUCKET_NAME')
export const AUDIT_BUCKET_NAME = getEnv('AUDIT_BUCKET_NAME')
export const AWS_REGION = 'eu-west-2'
export const INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP = getEnv(
  'INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'
)
export const PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP = getEnv(
  'PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'
)
export const AUDIT_REQUEST_DYNAMODB = getEnv('AUDIT_REQUEST_DYNAMODB_TABLE')
export const INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP = getEnv(
  'INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'
)
export const INITIATE_ATHENA_QUERY_QUEUE_URL = getEnv(
  'INITIATE_ATHENA_QUERY_QUEUE_URL'
)
export const TEST_DATA_BUCKET_NAME = getEnv('TEST_DATA_BUCKET_NAME')
export const TEST_FILE_NAME = 'test-audit-data.gz'
export const TEST_DATA_EVENT_ID = 'c9e2bf44-b95e-4f9a-81c4-cf02d42c1552'
export const TEST_DATA_DATA_PATHS =
  'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3'

export const INTEGRATION_TEST_DATE = '2022-01-01'
export const INTEGRATION_TEST_DATE_PREFIX = '2022/01/01'

export const INTEGRATION_TEST_DATE_GLACIER = '2022-02-14'
export const INTEGRATION_TEST_DATE_PREFIX_GLACIER = '2022/02/14'

export const ATHENA_QUERY_TEST_FILE_NAME = 'athena-query-test-data.gz'
export const ATHENA_QUERY_DATA_TEST_DATE_PREFIX = '2022/07/01'
