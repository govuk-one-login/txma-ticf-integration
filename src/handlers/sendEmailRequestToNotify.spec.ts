import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { defaultApiRequest } from '../utils/tests/events/defaultApiRequest'
import {
  ALL_NOTIFY_SECRETS,
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  TEST_SIGNED_URL,
  TICKET_ID
} from '../utils/tests/testConstants'
import { handler } from './sendEmailRequestToNotify'
import { NotifyClient } from 'notifications-node-client'
import { testSuccessfulNotifyResponse } from '../utils/tests/testNotifyResponses'

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
const givenSuccessfulSendEmailRequest = async () => {
  mockSendEmail.mockResolvedValue(testSuccessfulNotifyResponse)
}
const callHandlerWithBody = async () => {
  return await handler({
    ...defaultApiRequest,
    body: `{
      "email": "${TEST_NOTIFY_EMAIL}",
      "firstName": "${TEST_NOTIFY_NAME}",
      "zendeskId": "${TICKET_ID}",
      "signedUrl": "${TEST_SIGNED_URL}"
    }`
  })
}

describe('initiate sendEmailRequest handler', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'log')
  })

  it('creates a NotifyClient and calls sendEmail with correct parameters', async () => {
    await givenNotifySecretsAvailable()
    await givenSuccessfulSendEmailRequest()
    await callHandlerWithBody()

    expect(NotifyClient).toHaveBeenCalledWith('myNotifyApiKey')
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith(
      ALL_NOTIFY_SECRETS.notifyTemplateId,
      TEST_NOTIFY_EMAIL,
      {
        personalisation: {
          firstName: TEST_NOTIFY_NAME,
          zendeskId: TICKET_ID,
          signedUrl: TEST_SIGNED_URL
        }
      }
    )
    expect(console.log).toHaveBeenCalledWith({
      status: 201,
      emailSentTo: TEST_NOTIFY_EMAIL,
      subjectLine: 'Your data query has completed'
    })
  })
})
