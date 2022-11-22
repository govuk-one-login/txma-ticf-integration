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
export const INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP = getEnv(
  'INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'
)
export const TEST_DATA_BUCKET_NAME = getEnv('TEST_DATA_BUCKET_NAME')
export const TEST_FILE_NAME = 'test-audit-data.gz'
export const TEST_DATA_EVENT_ID = 'c9e2bf44-b95e-4f9a-81c4-cf02d42c1552'
export const TEST_DATA_DATA_PATHS =
  'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3'

export const INTEGRATION_TEST_DATE = '2022-01-01'
export const INTEGRATION_TEST_DATE_PREFIX = '2022/01/01'
export const INTEGRATION_TEST_DATE_MIX_DATA = '2022-01-05'
export const INTEGRATION_TEST_DATE_PREFIX_MIX_DATA = '2022/01/05'
export const INTEGRATION_TEST_DATE_GLACIER = '2022-02-14'
export const INTEGRATION_TEST_DATE_PREFIX_GLACIER = '2022/02/14'
export const INTEGRATION_TEST_DATE_NO_DATA = '2022-01-07'
export const INTEGRATION_TEST_DATE_PREFIX_NO_DATA = '2022/01/07'

export const ATHENA_QUERY_TEST_FILE_NAME = 'athena-query-test-data.gz'
export const ATHENA_QUERY_DATA_TEST_DATE_PREFIX = '2022/04/01'

export const END_TO_END_TEST_FILE_NAME = 'endToEndTestData.txt.gz'
export const END_TO_END_TEST_DATE_PREFIX = '2022/04/01'
export const END_TO_END_TEST_DATE = '2022-04-01'
export const END_TO_END_TEST_DATA_PATH =
  'restricted.name[0].nameParts[0].value restricted.name[0].nameParts[1].value restricted.birthDate[0].value restricted.address[0].validFrom restricted.address[1].postalCode'
export const END_TO_END_TEST_USER_ID =
  'urn:uuid:03d3c6d3-6d7c-41df-bf45-c94401c96a2e'
export const END_TO_END_TEST_SESSION_ID = '25bc52a5-3506-4d7a-8129-adc13a3152bf'
export const END_TO_END_TEST_JOURNEY_ID = '71b8300f-8f06-40e7-a53e-a194beacd33f'
export const END_TO_END_TEST_EVENT_ID = 'b122aa00-129b-46a9-b5f7-6b1bf07d427b'

export const WEBHOOK_RECEIVED_MESSAGE = 'received Zendesk webhook'
export const WEBHOOK_INVALID_MESSAGE = 'Zendesk request was invalid'
export const DATA_SENT_TO_QUEUE_MESSAGE =
  'Sent data transfer queue message with id'
export const CLOSE_ZENDESK_TICKET_COMMENT =
  'Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: From Date is in the future, To Date is in the future'
export const SQS_EVENT_RECEIVED_MESSAGE = 'Handling data request SQS event'
