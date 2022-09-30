import axios from 'axios'
import crypto from 'crypto'

const webhookRequestData = {
  zendeskId: '123',
  resultsEmail: 'user@test.gov.uk',
  resultsName: 'test user',
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

const awsBaseUrl = process.env.AWS_BASE_URL as string

const invalidRequestError = async (customHeaders: {
  [key: string]: string
}) => {
  return axios({
    url: `https://${awsBaseUrl}/Stage/zendesk-webhook`,
    method: 'POST',
    headers: {
      Host: awsBaseUrl,
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
  it('API Gateway returns an invalid request on invalid Zendesk Webhook Signature', async () => {
    const invalidSignature = 'cCxJHacr678ZZigFZZlYq4qz2XLWPEOeS+PPDuTivwQ='

    const headers = {
      'X-Zendesk-Webhook-Signature': invalidSignature
    }

    const errorResponse = await invalidRequestError(headers)
    expect(errorResponse.status).toBe(400)
    expect(errorResponse.data.message).toBe('Invalid request source')
  })
})

describe('Zendesk ticket check', () => {
  const generateSignatureHeaders = () => {
    const timestamp = '2022-09-05T09:52:10Z'
    const signature: string = crypto
      .createHmac('sha256', process.env.ZENDESK_WEBHOOK_SECRET_KEY as string)
      .update(timestamp + JSON.stringify(webhookRequestData))
      .digest('base64')

    return {
      'X-Zendesk-Webhook-Signature-Timestamp': timestamp,
      'X-Zendesk-Webhook-Signature': signature
    }
  }
  it('API Gateway returns an invalid request if the request refers to a non-existent Zendesk ticket', async () => {
    const headers = {
      ...generateSignatureHeaders()
    }

    const errorResponse = await invalidRequestError(headers)
    expect(errorResponse.status).toBe(404)
    expect(errorResponse.data.message).toBe('Zendesk ticket not found')
  })
})
