import { ZendeskApiSecrets } from '../../types/zendeskApiSecrets'

export const ZENDESK_TICKET_ID = '123'
export const ZENDESK_TICKET_ID_AS_NUMBER = 123
export const ALL_ZENDESK_SECRETS: ZendeskApiSecrets = {
  zendeskApiKey: 'myZendeskApiKey',
  zendeskApiUserId: 'myZendeskApiUserId',
  zendeskApiUserEmail: 'my_zendesk@api-user.email.com',
  zendeskHostName: 'example-host.zendesk.com',
  zendeskWebhookSecretKey: 'testSecretKey123'
}
export const ENCODED_AUTH_VALUE = 'EncodedAuthValue'
export const MOCK_INITIATE_DATA_REQUEST_QUEUE_URL =
  'https://initiate_data_request_queue_'
export const MOCK_INITIATE_ATHENA_QUERY_QUEUE_URL =
  'https://initiate_athena_query_queue_'
export const MOCK_TERMINATED_JOB_QUEUE_URL = 'https://terminate_job_queue_'
export const MOCK_SEND_EMAIL_QUEUE_URL = 'https://send_email_queue'
export const MOCK_AUDIT_DATA_REQUEST_EVENTS_QUEUE_URL =
  'https://audit_data_request_queue'
export const MOCK_QUERY_COMPLETED_QUEUE_URL = 'https://query_complete_queue'
export const TEST_ZENDESK_SECRET_ARN = 'myZendeskSecretName'
export const TEST_SECURE_DOWNLOAD_URL = 'secureDownload.url.com'
export const TEST_ANALYSIS_BUCKET = 'myAnalysisBucket'
export const TEST_ANALYSIS_BUCKET_ARN = 'myAnalysisBucketArn'
export const TEST_AUDIT_BUCKET = 'myAuditBucket'
export const TEST_QUERY_RESULTS_BUCKET = 'myQueryResultsBucket'

export const TEST_DATE_1 = '2021-08-21'
export const TEST_DATE_2 = '2021-09-10'
export const TEST_ATHENA_FORMATTED_DATE_1 = '2021/08/21'
export const TEST_ATHENA_FORMATTED_DATE_2 = '2021/09/10'

export const TEST_AWS_ACCOUNT_ID = '1234567890'
export const TEST_BATCH_JOB_MANIFEST_BUCKET_ARN = 'myManifestBucketArn'
export const TEST_BATCH_JOB_MANIFEST_BUCKET_NAME = 'myManifestBucketName'
export const TEST_BATCH_JOB_ROLE_ARN = 'myBatchJobRoleArn'
export const TEST_QUERY_DATABASE_TABLE_NAME = 'test_query_table'
export const TEST_RECIPIENT_EMAIL = 'myuser@test.gov.uk'
export const TEST_RECIPIENT_NAME = 'my name'
export const TEST_REQUESTER_EMAIL = 'myrequestuser@test.gov.uk'
export const TEST_REQUESTER_NAME = 'my requester name'

export const TEST_MAXIMUM_GLACIER_STATUS_CHECK_COUNT = 484
export const TEST_MAXIMUM_COPY_STATUS_CHECK_COUNT = 60

export const TEST_ZENDESK_FIELD_ID_DATA_PATHS = 1
export const TEST_ZENDESK_FIELD_ID_DATE_FROM = 2
export const TEST_ZENDESK_FIELD_ID_DATE_TO = 3
export const TEST_ZENDESK_FIELD_ID_EVENT_IDS = 4
export const TEST_ZENDESK_FIELD_ID_IDENTIFIER_TYPE = 5
export const TEST_ZENDESK_FIELD_ID_JOURNEY_IDS = 6
export const TEST_ZENDESK_FIELD_ID_PII_TYPES = 7
export const TEST_ZENDESK_FIELD_ID_SESSION_IDS = 8
export const TEST_ZENDESK_FIELD_ID_USER_IDS = 9
export const TEST_ZENDESK_FIELD_ID_RECIPIENT_EMAIL = 10
export const TEST_ZENDESK_FIELD_ID_RECIPIENT_NAME = 11
export const TEST_ZENDESK_FIELD_ID_DATES = 12
export const TEST_DOWNLOAD_HASH = 'myDownloadHash'
export const TEST_SECURE_DOWNLOAD_WEBSITE_BASE_PATH =
  'http://my-download-website/secure'
export const TEST_SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME = 'secureDownloadDynamoDb'
export const TEST_ATHENA_QUERY_ID = 'abc123'
export const TEST_VALID_EMAIL_RECIPIENTS_BUCKET = 'myEmailRecipientsBucket'
export const TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY =
  'myEmailRecipientsBucketKey'
export const TEST_COMMENT_COPY = 'test comment copy'
export const TEST_CURRENT_EPOCH_SECONDS = 1670335764
export const TEST_DATABASE_TTL_HOURS = 120

export const ZENDESK_PII_TYPE_PREFIX = 'pii_requested_'

export const TEST_DECRYPTION_LAMBDA_ARN = 'myDecryptionLambdaArn'
export const TEST_GENERATOR_KEY_ID = 'testEncryptionKey'
export const TEST_S3_OBJECT_KEY = 'testKey'
export const TEST_S3_OBJECT_DATA_STRING = 'testData'
export const TEST_S3_OBJECT_DATA_BUFFER = Buffer.from(
  TEST_S3_OBJECT_DATA_STRING
)
export const TEST_PERMANENT_BUCKET_NAME = 'testPermanentBucket'
export const TEST_PERMANENT_BUCKET_ARN = 'arn:aws:s3:::testPermanentBucket'
export const TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID =
  'e53df0c4-a91b-4a2a-8084-5bdd32a15403'
