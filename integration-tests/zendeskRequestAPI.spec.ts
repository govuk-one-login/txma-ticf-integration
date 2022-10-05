import axios from 'axios'
import { getEnvVariable } from './lib/zendeskParameters'

describe('Zendesk request integrity', () => {
  it('API Gateway returns an invalid request on invalid Zendesk Webhook Signature', async () => {
    const invalidSignature = 'cCxJHacr678ZZigFZZlYq4qz2XLWPEOeS+PPDuTivwQ='

    const data = {
      zendeskId: '408',
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

    const headers = {
      'X-Zendesk-Webhook-Signature': invalidSignature
    }

    const invalidRequestError = async () => {
      return axios({
        url: getEnvVariable('AWS_WEBHOOK_URL'),
        method: 'POST',
        headers,
        data
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

    const errorResponse = await invalidRequestError()
    expect(errorResponse.status).toBe(400)
    expect(errorResponse.data.message).toBe('Invalid request source')
  })
})
