import { ZendeskApiSecrets } from '../../types/zendeskApiSecrets'

export const ZENDESK_TICKET_ID = '123'
export const ALL_SECRET_KEYS: ZendeskApiSecrets = {
  zendeskApiKey: 'myZendeskApiKey',
  zendeskApiUserId: 'myZendeskApiUserId',
  zendeskApiUserEmail: 'my_zendesk@api-user.email.com',
  zendeskHostName: 'example-host.zendesk.com',
  zendeskWebhookSecretKey: 'testSecretKey123'
}
export const ENCODED_AUTH_VALUE = 'EncodedAuthValue'
export const MOCK_INITIATE_DATA_REQUEST_QUEUE_URL =
  'https://initiate_data_request_queue_'
export const TEST_ZENDESK_SECRET_NAME = 'myZendeskSecretName'
export const TEST_ANALYSIS_BUCKET = 'myAnalysisBucket'
export const TEST_AUDIT_BUCKET = 'myAuditBucket'
export const TEST_DATE_FROM = '2021-08-21'
export const TEST_DATE_TO = '2021-08-21'
export const TEST_BATCH_JOB_MANIFEST_BUCKET_ARN = 'myManifestBucketArn'
