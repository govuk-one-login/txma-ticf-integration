import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { defaultApiRequest } from '../utils/tests/events/defaultApiRequest'
import {
  ALL_NOTIFY_SECRETS,
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  TEST_SIGNED_URL,
  ZENDESK_TICKET_ID
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
const givenUnsuccessfulSendEmailRequest = async () => {
  mockSendEmail.mockImplementation(() => {
    throw new Error('There was an error sending request to Notify')
  })
}
const validEventBody = `{
      "email": "${TEST_NOTIFY_EMAIL}",
      "firstName": "${TEST_NOTIFY_NAME}",
      "zendeskId": "${ZENDESK_TICKET_ID}",
      "signedUrl": "${TEST_SIGNED_URL}"
    }`
const callHandlerWithBody = async (customBody: string) => {
  return await handler({
    ...defaultApiRequest,
    body: customBody
  })
}

describe('initiate sendEmailRequest handler', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'error')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('creates a NotifyClient and calls sendEmail with correct parameters', async () => {
    jest.spyOn(global.console, 'log')
    await givenNotifySecretsAvailable()
    await givenSuccessfulSendEmailRequest()

    await callHandlerWithBody(validEventBody)

    expect(NotifyClient).toHaveBeenCalledWith('myNotifyApiKey')
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith(
      ALL_NOTIFY_SECRETS.notifyTemplateId,
      TEST_NOTIFY_EMAIL,
      {
        personalisation: {
          firstName: TEST_NOTIFY_NAME,
          zendeskId: ZENDESK_TICKET_ID,
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
  it('returns a 400 status code with a message', async () => {
    await givenNotifySecretsAvailable()
    await givenUnsuccessfulSendEmailRequest()

    await callHandlerWithBody(validEventBody)

    expect(NotifyClient).toHaveBeenCalledWith('myNotifyApiKey')
    expect(mockSendEmail).toThrowError()
    expect(mockSendEmail).toHaveBeenCalledWith(
      ALL_NOTIFY_SECRETS.notifyTemplateId,
      TEST_NOTIFY_EMAIL,
      {
        personalisation: {
          firstName: TEST_NOTIFY_NAME,
          zendeskId: ZENDESK_TICKET_ID,
          signedUrl: TEST_SIGNED_URL
        }
      }
    )
    expect(console.error).toHaveBeenCalledWith(
      'There was an error sending a request to Notify: ',
      Error('There was an error sending request to Notify')
    )
  })
  it('returns from the function and logs an error when no event body is present', async () => {
    const invalidEventBody = ''

    await callHandlerWithBody(invalidEventBody)

    expect(console.error).toHaveBeenCalledWith(
      'Could not find event body. An email has not been sent'
    )
    expect(NotifyClient).not.toHaveBeenCalled()
  })
  it.each(['firstName', 'email', 'signedUrl', 'zendeskId'])(
    'returns from the function and logs an error when %p is missing from the event body',
    async (missingPropertyName: string) => {
      const eventBodyParams = {
        email: TEST_NOTIFY_EMAIL,
        firstName: TEST_NOTIFY_NAME,
        zendeskId: ZENDESK_TICKET_ID,
        signedUrl: TEST_SIGNED_URL
      } as { [key: string]: string }
      delete eventBodyParams[missingPropertyName]
      console.log(eventBodyParams)
      await givenNotifySecretsAvailable()

      await callHandlerWithBody(JSON.stringify(eventBodyParams))

      expect(console.error).toHaveBeenLastCalledWith(
        'There was an error sending a request to Notify: ',
        Error('Required details were not all present in event body')
      )
      expect(NotifyClient).not.toHaveBeenCalled()
    }
  )
})
