import {
  ZENDESK_END_USER_NAME,
  ZENDESK_RECIPIENT_NAME
} from './constants/zendeskParameters'
import { ZendeskWebhookRequest } from './types/zendeskWebhookRequest'
import { generateSignatureHeaders } from './utils/zendesk/generateSignatureHeaders'
import {
  TEST_DATA_DATA_PATHS,
  TEST_DATA_EVENT_ID
} from './constants/awsParameters'
import { sendWebhookRequest } from './utils/zendesk/sendWebhookRequest'

const defaultWebhookRequestData: ZendeskWebhookRequest = {
  zendeskId: '1',
  recipientEmail: 'fake-ticf-recipient@test.gov.uk', // make constant
  recipientName: ZENDESK_RECIPIENT_NAME,
  requesterEmail: 'fake-ticf-analyst@test.gov.uk',
  requesterName: ZENDESK_END_USER_NAME,
  dateFrom: '2022-01-01',
  dateTo: '2022-01-01',
  identifierType: 'event_id',
  eventIds: TEST_DATA_EVENT_ID,
  piiTypes: 'drivers_license',
  sessionIds: '',
  journeyIds: '',
  userIds: '',
  dataPaths: TEST_DATA_DATA_PATHS
}

describe('Zendesk request integrity', () => {
  test('API Gateway returns an invalid request on invalid Zendesk Webhook Signature', async () => {
    const invalidSignature = 'cCxJHacr678ZZigFZZlYq4qz2XLWPEOeS+PPDuTivwQ='

    const headers = {
      'X-Zendesk-Webhook-Signature': invalidSignature
    }

    const errorResponse = await sendWebhookRequest(
      headers,
      defaultWebhookRequestData
    )
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual('Invalid request source')
  })
})

describe('Zendesk ticket check', () => {
  let ticketId: string

  beforeAll(async () => {
    ticketId = '1'
  })

  test('API Gateway returns 200 for a matching zendesk ticket', async () => {
    const webhookRequestData = defaultWebhookRequestData
    webhookRequestData.zendeskId = ticketId

    const headers = {
      ...generateSignatureHeaders(webhookRequestData)
    }
    const response = await sendWebhookRequest(headers, webhookRequestData)
    expect(response.status).toEqual(200)
    expect(response.data.message).toEqual('data transfer initiated')
  })

  test('API Gateway returns a 404 response if the request refers to a non-existent Zendesk ticket', async () => {
    const webhookRequestData = defaultWebhookRequestData
    webhookRequestData.zendeskId = '10000000000000000'

    const headers = {
      ...generateSignatureHeaders(defaultWebhookRequestData)
    }

    const errorResponse = await sendWebhookRequest(
      headers,
      defaultWebhookRequestData
    )
    expect(errorResponse.status).toEqual(404)
    expect(errorResponse.data.message).toEqual('Zendesk ticket not found')
  })

  test('API Gateway returns a 400 response if the request does not match info in corresponding Zendesk ticket', async () => {
    const webhookRequestData = defaultWebhookRequestData
    webhookRequestData.zendeskId = ticketId
    webhookRequestData.identifierType = 'journey_id'
    webhookRequestData.journeyIds = '3457879'

    const headers = {
      ...generateSignatureHeaders(webhookRequestData)
    }

    const errorResponse = await sendWebhookRequest(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual(
      'Request parameters do not match a Zendesk Ticket'
    )
  })
})
