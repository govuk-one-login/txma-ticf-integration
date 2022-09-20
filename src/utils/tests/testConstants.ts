import { NotifyApiSecrets } from '../../types/notifyApiSecrets'
import { ZendeskApiSecrets } from '../../types/zendeskApiSecrets'

export const TICKET_ID = '123'
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
export const TEST_ZENDESK_SECRET_NAME = 'myZendeskSecretName'
export const TEST_NOTIFY_SECRET_NAME = 'myNotifySecretName'
