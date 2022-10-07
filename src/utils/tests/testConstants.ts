import { NotifyApiSecrets } from '../../types/notifyApiSecrets'
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
export const ALL_NOTIFY_SECRETS: NotifyApiSecrets = {
  notifyApiKey: 'myNotifyApiKey',
  notifyTemplateId: 'myNotifyTemplateId'
}
export const ENCODED_AUTH_VALUE = 'EncodedAuthValue'
export const MOCK_INITIATE_DATA_REQUEST_QUEUE_URL =
  'https://initiate_data_request_queue_'
export const TEST_ZENDESK_SECRET_NAME = 'myZendeskSecretName'
export const TEST_NOTIFY_SECRET_NAME = 'myNotifySecretName'
export const TEST_NOTIFY_EMAIL = 'test@email.com'
export const TEST_NOTIFY_NAME = 'TestName'
export const TEST_SIGNED_URL = 'signed.url.com'
export const TEST_ANALYSIS_BUCKET = 'myAnalysisBucket'
export const TEST_AUDIT_BUCKET = 'myAuditBucket'
export const TEST_DATE_FROM = '2021-08-21'
export const TEST_DATE_TO = '2021-08-21'
export const TEST_BATCH_JOB_MANIFEST_BUCKET_ARN = 'myManifestBucketArn'
export const TEST_BATCH_JOB_MANIFEST_BUCKET_NAME = 'myManifestBucketName'
export const TEST_AWS_ACCOUNT_ID = '1234567890'
export const TEST_BATCH_JOB_ROLE_ARN = 'myBatchJobRoleArn'

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
