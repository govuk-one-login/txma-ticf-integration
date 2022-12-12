import { getWebhookRequestDataForTestCaseNumberAndDate } from '../utils/getWebhookRequestDataForTestCaseNumberAndDate'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'
import { ZendeskWebhookRequest } from '../../shared-test-code/types/zendeskWebhookRequest'

describe('Zendesk request integrity', () => {
  it('API Gateway returns an invalid request on invalid Zendesk Webhook Signature', async () => {
    const defaultWebhookRequestData =
      getWebhookRequestDataForTestCaseNumberAndDate(1, '2022-01-01')
    const invalidSignature = 'cCxJHacr678ZZigFZZlYq4qz2XLWPEOeS+PPDuTivwQ='
    const headers = {
      'X-Zendesk-Webhook-Signature': invalidSignature
    }

    const errorResponse = await sendWebhookRequest(
      defaultWebhookRequestData,
      headers
    )

    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual('Invalid request source')
  })
})

describe('Zendesk ticket check', () => {
  let defaultWebhookRequestData: ZendeskWebhookRequest

  beforeEach(() => {
    defaultWebhookRequestData = {
      ...getWebhookRequestDataForTestCaseNumberAndDate(1, '2022-01-01')
    }
  })

  it('API Gateway returns 200 for a matching zendesk ticket', async () => {
    const response = await sendWebhookRequest(defaultWebhookRequestData)

    expect(response.status).toEqual(200)
    expect(response.data.message).toEqual('data transfer initiated')
  })

  it('API Gateway returns a 404 response if the request refers to a non-existent Zendesk ticket', async () => {
    defaultWebhookRequestData.zendeskId = '0'

    const errorResponse = await sendWebhookRequest(defaultWebhookRequestData)

    expect(errorResponse.status).toEqual(404)
    expect(errorResponse.data.message).toEqual('Zendesk ticket not found')
  })

  it('API Gateway returns a 400 response if the request does not match info in corresponding Zendesk ticket', async () => {
    defaultWebhookRequestData.identifierType = 'journey_id'
    defaultWebhookRequestData.journeyIds = '3457879'

    const errorResponse = await sendWebhookRequest(defaultWebhookRequestData)

    expect(errorResponse.status).toEqual(400)
    expect(errorResponse.data.message).toEqual(
      'Request parameters do not match a Zendesk Ticket'
    )
  })
})
