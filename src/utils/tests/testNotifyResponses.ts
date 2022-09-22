import {
  ALL_NOTIFY_SECRETS,
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  TICKET_ID
} from './testConstants'

export const testSuccessfulNotifyResponse = JSON.stringify({
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
        "zendeskId":"${TICKET_ID}",
        "signedUrl":"signedurl.com",
        "reference":""
      }
    }`
  },
  data: {
    content: {
      subject: 'Your data query has completed'
    }
  }
})
