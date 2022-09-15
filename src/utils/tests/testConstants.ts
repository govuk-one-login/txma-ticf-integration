import { ZendeskApiSecrets } from '../../types/zendeskApiSecrets'

export const TICKET_ID = '123'
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
