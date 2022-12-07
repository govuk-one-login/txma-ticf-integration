import axios from 'axios'
import { deleteZendeskTicket } from '../shared-test-code/utils/zendesk/deleteZendeskTicket'
import {
  generateZendeskRequestDate,
  getEnv
} from '../shared-test-code/utils/helpers'
import { createZendeskTicket } from '../shared-test-code/utils/zendesk/createZendeskTicket'
import {
  ZENDESK_END_USER_EMAIL,
  ZENDESK_END_USER_NAME,
  ZENDESK_RECIPIENT_NAME
} from '../shared-test-code/constants/zendeskParameters'
import { ZendeskWebhookRequest } from './types/zendeskWebhookRequest'
import { generateSignatureHeaders } from '../shared-test-code/utils/zendesk/generateSignatureHeaders'
import {
  TEST_DATA_DATA_PATHS,
  TEST_DATA_EVENT_ID
} from '../shared-test-code/constants/awsParameters'
import { validApiTestRequestData } from '../shared-test-code/constants/requestData/webhookAPIRequestData'

const webhookUrl = `${getEnv('ZENDESK_WEBHOOK_API_BASE_URL')}/zendesk-webhook`

const defaultWebhookRequestData: ZendeskWebhookRequest = {
  zendeskId: '1',
  recipientEmail: getEnv('ZENDESK_RECIPIENT_EMAIL'),
  recipientName: ZENDESK_RECIPIENT_NAME,
  requesterEmail: ZENDESK_END_USER_EMAIL,
  requesterName: ZENDESK_END_USER_NAME,
  dateFrom: generateZendeskRequestDate(-60),
  dateTo: generateZendeskRequestDate(-60),
  identifierType: 'event_id',
  eventIds: TEST_DATA_EVENT_ID,
  piiTypes: 'drivers_license',
  sessionIds: '',
  journeyIds: '',
  userIds: '',
  dataPaths: TEST_DATA_DATA_PATHS
}

const sendWebhook = async (
  customHeaders: {
    [key: string]: string
  },
  webhookRequestData: ZendeskWebhookRequest
) => {
  return axios({
    url: webhookUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders
    },
    data: webhookRequestData
  })
    .then((res) => {
      return {
        data: res.data,
        status: res.status
      }
    })
    .catch((error) => {
      if (error.response) {
        return error.response
      }
      console.log(error.status)
      throw 'No response recieved from gateway'
    })
}

describe('Zendesk request integrity', () => {
  test('API Gateway returns an invalid request on invalid Zendesk Webhook Signature', async () => {
    const invalidSignature = 'cCxJHacr678ZZigFZZlYq4qz2XLWPEOeS+PPDuTivwQ='

    const headers = {
      'X-Zendesk-Webhook-Signature': invalidSignature
    }

    const errorResponse = await sendWebhook(headers, defaultWebhookRequestData)
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual('Invalid request source')
  })
})

describe('Zendesk ticket check', () => {
  let ticketId: string

  beforeAll(async () => {
    ticketId = await createZendeskTicket(validApiTestRequestData)
  })

  afterAll(async () => {
    await deleteZendeskTicket(ticketId)
  })

  test('API Gateway returns 200 for a matching zendesk ticket', async () => {
    const webhookRequestData = defaultWebhookRequestData
    webhookRequestData.zendeskId = ticketId

    const headers = {
      ...generateSignatureHeaders(webhookRequestData)
    }
    const response = await sendWebhook(headers, webhookRequestData)
    expect(response.status).toEqual(200)
    expect(response.data.message).toEqual('data transfer initiated')
  })

  test('API Gateway returns a 404 response if the request refers to a non-existent Zendesk ticket', async () => {
    const webhookRequestData = defaultWebhookRequestData
    webhookRequestData.zendeskId = '10000000000000000'

    const headers = {
      ...generateSignatureHeaders(defaultWebhookRequestData)
    }

    const errorResponse = await sendWebhook(headers, defaultWebhookRequestData)
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

    const errorResponse = await sendWebhook(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual(
      'Request parameters do not match a Zendesk Ticket'
    )
  })
})
