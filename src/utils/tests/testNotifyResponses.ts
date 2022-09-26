import { CustomAxiosResponse } from '../../types/notify/customAxiosResponse'
import {
  ALL_NOTIFY_SECRETS,
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  ZENDESK_TICKET_ID
} from './testConstants'

export const testSuccessfulNotifyResponse: CustomAxiosResponse = {
  status: 201,
  statusText: 'Created',
  config: {
    method: 'post',
    url: 'api.endpoint.com/email',
    data: `{
      "template_id":"${ALL_NOTIFY_SECRETS.notifyTemplateId}",
      "email_address":"${TEST_NOTIFY_EMAIL}",
      "personalisation":{
        "firstName":"${TEST_NOTIFY_NAME}",
        "zendeskId":"${ZENDESK_TICKET_ID}",
        "signedUrl":"signedurl.com"
      }
    }`
  },
  data: {
    content: {
      subject: 'Your data query has completed'
    }
  }
}
