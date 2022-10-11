import axios from 'axios'
import crypto from 'crypto'
import { zendeskCopy } from '../src/i18n/zendeskCopy'
import { interpolateTemplate } from '../src/utils/interpolateTemplate'

//TODO: test setup and teardown for creating and deleting a ticket to use

const baseUrl = process.env.ZENDESK_WEBHOOK_API_BASE_URL as string

const invalidRequestError = async (
  customHeaders: {
    [key: string]: string
  },
  webhookRequestData: {
    [key: string]: string
  }
) => {
  return axios({
    url: `${baseUrl}/zendesk-webhook`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders
    },
    data: webhookRequestData
  })
    .then(() => {
      throw 'Gateway did not return an error'
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

    const errorResponse = await invalidRequestError(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual(
      interpolateTemplate('invalidSignature', zendeskCopy)
    )
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
  test('API Gateway returns a 404 response if the request refers to a non-existent Zendesk ticket', async () => {
    const webhookRequestData = {
      //no ticket with id 1 exists
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

    const errorResponse = await invalidRequestError(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(404)
    expect(errorResponse.data.message).toEqual(
      interpolateTemplate('ticketNotFound', zendeskCopy)
    )
  })

  test('API Gateway returns a 400 response if the request does not match info in corresponding Zendesk ticket', async () => {
    const webhookRequestData = {
      //ticket with ID 881 exists with different info
      zendeskId: '881',
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

    const errorResponse = await invalidRequestError(headers, webhookRequestData)
    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual(
      interpolateTemplate('responseMessageWhenParamsMismatch', zendeskCopy)
    )
  })
})
