import { handler } from './zendeskWebhook'
import { defaultApiRequest } from '../testUtils/events/defaultApiRequest'
test('returns 200 response', async () => {
  const expectedResult = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'ok'
    })
  }

  const result = await handler({
    ...defaultApiRequest,
    path: '/zendesk-webhook'
  })

  expect(result).toEqual(expectedResult)
})
