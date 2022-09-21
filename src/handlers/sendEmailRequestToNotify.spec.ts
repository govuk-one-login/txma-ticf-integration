import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { defaultApiRequest } from '../utils/tests/events/defaultApiRequest'
import { ALL_NOTIFY_SECRETS } from '../utils/tests/testConstants'
import { handler } from './sendEmailRequestToNotify'

const mockRetrieveNotifySecrets = retrieveNotifySecrets as jest.Mock

jest.mock('../secrets/retrieveNotifySecrets', () => ({
  retrieveNotifySecrets: jest.fn()
}))

const givenNotifySecretsAvailable = () => {
  mockRetrieveNotifySecrets.mockResolvedValue(ALL_NOTIFY_SECRETS)
}

const requestBody = '{"email":"test@email.com"}'
const callHandlerWithBody = async () => {
  return await handler({
    ...defaultApiRequest,
    body: requestBody
  })
}

describe('initiate sendEmailRequest handler', () => {
  xit('returns a response when email was sent', async () => {
    givenNotifySecretsAvailable()
    const result = await callHandlerWithBody()
    expect(result).toHaveBeenCalled()
  })
})
