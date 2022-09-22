import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { defaultApiRequest } from '../utils/tests/events/defaultApiRequest'
import { ALL_NOTIFY_SECRETS } from '../utils/tests/testConstants'
import { handler } from './sendEmailRequestToNotify'
import { NotifyClient } from 'notifications-node-client'

jest.mock('../secrets/retrieveNotifySecrets', () => ({
  retrieveNotifySecrets: jest.fn()
}))

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => {
    return { sendEmail: mockSendEmail }
  })
}))

const mockRetrieveNotifySecrets = retrieveNotifySecrets as jest.Mock
const mockSendEmail = jest.fn()

const givenNotifySecretsAvailable = async () => {
  mockRetrieveNotifySecrets.mockResolvedValue(ALL_NOTIFY_SECRETS)
}

const testEmail = 'test@email.com'
const callHandlerWithBody = async () => {
  return await handler({
    ...defaultApiRequest,
    body: `{"email": "${testEmail}"}`
  })
}

describe('initiate sendEmailRequest handler', () => {
  it('creates a NotifyClient and calls sendEmail with correct parameters', async () => {
    await givenNotifySecretsAvailable()
    await callHandlerWithBody()

    expect(NotifyClient).toHaveBeenCalledWith('myNotifyApiKey')
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith(
      'myNotifyTemplateId',
      testEmail,
      {
        personalisation: {
          firstName: 'Mabon',
          zendeskId: '123',
          signedUrl: 'signedurl.com',
          reference: ''
        }
      }
    )
  })
})
