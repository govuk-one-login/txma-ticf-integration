import axios from 'axios'
import crypto from 'crypto'
import { deleteZendeskTicket } from './utils/deleteZendeskTicket'
import { generateZendeskRequestDate } from './utils/helpers'
import { createZendeskRequest } from './utils/createZendeskTicket'
import { getEnvVariable } from './lib/zendeskParameters'

const baseUrl = process.env.ZENDESK_WEBHOOK_API_BASE_URL as string
const webhookUrl = `${baseUrl}/zendesk-webhook`

const sendWebhook = async (
  customHeaders: {
    [key: string]: string
  },
  webhookRequestData: {
    [key: string]: string
  }
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
      console.log(error)
      throw 'No response recieved from gateway'
    })
}

describe('Zendesk request integrity', () => {
  test('API Gateway returns an invalid request on invalid Zendesk Webhook Signature', async () => {
    const invalidSignature = 'cCxJHacr678ZZigFZZlYq4qz2XLWPEOeS+PPDuTivwQ='

    const headers = {
      'X-Zendesk-Webhook-Signature': invalidSignature
    }

    const webhookRequestData = {
      zendeskId: '123',
      recipientEmail: 'user@test.gov.uk',
      recipientName: 'test user',
      requesterEmail: 'user@test.gov.uk',
      requesterName: 'test user',
      dateFrom: '2022-09-06',
      dateTo: '2022-09-06',
      identifierType: 'journey_id',
      sessionIds: '',
      journeyIds: '098 565 2213',
      userIds: '',
      eventIds: '',
      piiTypes: 'name',
      dataPaths: ''
    }

    const errorResponse = await sendWebhook(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual('Invalid request source')
  })
})

describe('Zendesk ticket check', () => {
  const generateSignatureHeaders = (requestData: { [key: string]: string }) => {
    const timestamp = '2022-09-05T09:52:10Z'
    const signature: string = crypto
      .createHmac('sha256', process.env.ZENDESK_WEBHOOK_SECRET_KEY as string)
      .update(timestamp + JSON.stringify(requestData))
      .digest('base64')

    return {
      'X-Zendesk-Webhook-Signature-Timestamp': timestamp,
      'X-Zendesk-Webhook-Signature': signature
    }
  }

  let ticketId: string

  beforeAll(async () => {
    ticketId = await createZendeskRequest()
    return ticketId
  })

  afterAll(async () => {
    return deleteZendeskTicket(ticketId)
  })

  test('API Gateway returns 200 for a matching zendesk ticket', async () => {
    const webhookRequestData = {
      zendeskId: ticketId,
      recipientEmail: getEnvVariable('ZENDESK_END_USER_EMAIL'),
      recipientName: 'Txma-team2-ticf-analyst-dev',
      requesterEmail: getEnvVariable('ZENDESK_END_USER_EMAIL'),
      requesterName: 'Txma-team2-ticf-analyst-dev',
      dateFrom: generateZendeskRequestDate(-60),
      dateTo: generateZendeskRequestDate(-60),
      identifierType: 'event_id',
      eventIds: '637783 3256',
      piiTypes: 'drivers_license'
    }

    //   const webhookRequestData = {
    //      zendeskId: ticketId,
    //     "recipientEmail": "txma-team2-ticf-analyst-dev@test.gov.uk",
    //     "recipientName": "Txma-team2-ticf-analyst-dev",
    //     "requesterEmail": "txma-team2-ticf-analyst-dev@test.gov.uk",
    //     "requesterName": "Txma-team2-ticf-analyst-dev",
    //     "dateFrom": "2022-08-13",
    //     "dateTo": "2022-08-13",
    //     "identifierType": "event_id",
    //     "sessionIds": "",
    //     "journeyIds": "",
    //     "userIds": "",
    //     "eventIds": "637783 3256",
    //     "piiTypes": "drivers_license",
    //     "dataPaths": ""
    // }

    const headers = {
      ...generateSignatureHeaders(webhookRequestData)
    }
    const response = await sendWebhook(headers, webhookRequestData)
    console.log(response.status)
    console.log(response.data)
    console.log(webhookRequestData)
    expect(response.status).toEqual(200)
    expect(response.data.message).toEqual('data tranfer initiated')
  })

  test('API Gateway returns a 404 response if the request refers to a non-existent Zendesk ticket', async () => {
    const webhookRequestData = {
      zendeskId: '1',
      recipientEmail: 'user@test.gov.uk',
      recipientName: 'test user',
      requesterEmail: 'user@test.gov.uk',
      requesterName: 'test user',
      dateFrom: '2022-09-06',
      dateTo: '2022-09-06',
      identifierType: 'journey_id',
      sessionIds: '',
      journeyIds: '098 565 2213',
      userIds: '',
      eventIds: '',
      piiTypes: 'name',
      dataPaths: ''
    }

    const headers = {
      ...generateSignatureHeaders(webhookRequestData)
    }

    const errorResponse = await sendWebhook(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(404)
    expect(errorResponse.data.message).toEqual('Zendesk ticket not found')
  })

  test('API Gateway returns a 400 response if the request does not match info in corresponding Zendesk ticket', async () => {
    const webhookRequestData = {
      zendeskId: ticketId,
      recipientEmail: 'user@test.gov.uk',
      recipientName: 'test user',
      requesterEmail: 'user@test.gov.uk',
      requesterName: 'test user',
      dateFrom: '2022-09-06',
      dateTo: '2022-09-06',
      identifierType: 'journey_id',
      sessionIds: '',
      journeyIds: '098 565 2213',
      userIds: '',
      eventIds: '',
      piiTypes: 'name',
      dataPaths: ''
    }

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
