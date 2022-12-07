import crypto from 'crypto'
import { ZendeskWebhookRequest } from '../../../integration-tests/types/zendeskWebhookRequest'
import { getEnv } from '../helpers'

export const generateSignatureHeaders = (
  requestData: ZendeskWebhookRequest
) => {
  const timestamp = '2022-09-05T09:52:10Z'
  const signature: string = crypto
    .createHmac('sha256', getEnv('ZENDESK_WEBHOOK_SECRET_KEY'))
    .update(timestamp + JSON.stringify(requestData))
    .digest('base64')

  return {
    'X-Zendesk-Webhook-Signature-Timestamp': timestamp,
    'X-Zendesk-Webhook-Signature': signature
  }
}
