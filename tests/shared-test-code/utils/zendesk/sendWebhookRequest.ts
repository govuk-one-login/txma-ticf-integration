import axios from 'axios'
import { ZendeskWebhookRequest } from '../../../integration-tests/types/zendeskWebhookRequest'
import { getEnv } from '../helpers'
import { generateSignatureHeaders } from './generateSignatureHeaders'

export const sendWebhookRequest = async (
  webhookRequestData: ZendeskWebhookRequest,
  customHeaders?: {
    [key: string]: string
  }
) => {
  return await axios({
    url: `${getEnv('ZENDESK_WEBHOOK_API_BASE_URL')}/zendesk-webhook`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customHeaders
        ? customHeaders
        : generateSignatureHeaders(webhookRequestData))
    },
    data: webhookRequestData,

    // Will never throw errors, regardless of HTTP status code, so we can just assert below without
    // having to try/catch.
    validateStatus: () => true
  })
}
