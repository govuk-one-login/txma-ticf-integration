import axios from 'axios'
import { ZendeskWebhookRequest } from '../../types/zendeskWebhookRequest'
import { getEnv } from '../helpers'

export const sendWebhookRequest = async (
  customHeaders: {
    [key: string]: string
  },
  webhookRequestData: ZendeskWebhookRequest
) => {
  return await axios({
    url: `${getEnv('ZENDESK_WEBHOOK_API_BASE_URL')}/zendesk-webhook`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders
    },
    data: webhookRequestData,
    validateStatus: function () {
      // Will never throw errors, regardless of HTTP status code, so we can just assert below without
      // having to try/catch.
      return true
    }
  })
}
