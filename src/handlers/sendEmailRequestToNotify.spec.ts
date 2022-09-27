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
import { updateZendeskTicketById } from '../services/updateZendeskTicket'

jest.mock('../secrets/retrieveNotifySecrets', () => ({
  retrieveNotifySecrets: jest.fn()
}))

jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn().mockImplementation(() => {
    return { sendEmail: mockSendEmail }
  })
}))

jest.mock('../services/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

const mockRetrieveNotifySecrets = retrieveNotifySecrets as jest.Mock
const mockSendEmail = jest.fn()
const mockUpdateZendeskTicketById = updateZendeskTicketById as jest.Mock

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
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'A link to your results has been sent to you.',
      'closed'
    )
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
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'Your results could not be emailed.',
      'closed'
    )
  })
  it('returns from the function and logs an error when no event body is present', async () => {
    const invalidEventBody = ''

    await callHandlerWithBody(invalidEventBody)

    expect(console.error).toHaveBeenCalledWith(
      'Could not find event body. An email has not been sent'
    )
    expect(NotifyClient).not.toHaveBeenCalled()
    expect(mockUpdateZendeskTicketById).not.toHaveBeenCalled()
  })
  it.each(['firstName', 'email', 'signedUrl'])(
    'returns from the function, updates Zendesk ticket, and logs an error when %p is missing from the event body',
    async (missingPropertyName: string) => {
      const eventBodyParams = {
        email: TEST_NOTIFY_EMAIL,
        firstName: TEST_NOTIFY_NAME,
        signedUrl: TEST_SIGNED_URL,
        zendeskId: ZENDESK_TICKET_ID
      } as { [key: string]: string }
      delete eventBodyParams[missingPropertyName]
      await givenNotifySecretsAvailable()

      await callHandlerWithBody(JSON.stringify(eventBodyParams))

      expect(console.error).toHaveBeenLastCalledWith(
        'There was an error sending a request to Notify: ',
        Error('Required details were not all present in event body')
      )
      expect(NotifyClient).not.toHaveBeenCalled()
      expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
        ZENDESK_TICKET_ID,
        'Your results could not be emailed.',
        'closed'
      )
    }
  )
  it.each(['firstName', 'email', 'signedUrl'])(
    'returns from the function, updates Zendesk ticket, and logs an error when %p is an empty string',
    async (emptyStringPropertyName: string) => {
      const eventBodyParams = {
        email: TEST_NOTIFY_EMAIL,
        firstName: TEST_NOTIFY_NAME,
        signedUrl: TEST_SIGNED_URL,
        zendeskId: ZENDESK_TICKET_ID
      } as { [key: string]: string }
      eventBodyParams[emptyStringPropertyName] = ''
      await givenNotifySecretsAvailable()

      await callHandlerWithBody(JSON.stringify(eventBodyParams))

      expect(console.error).toHaveBeenLastCalledWith(
        'There was an error sending a request to Notify: ',
        Error('Required details were not all present in event body')
      )
      expect(NotifyClient).not.toHaveBeenCalled()
    }
  )
  it('returns from the function and logs an error when zendeskId is missing from the event body', async () => {
    const eventBodyParams = {
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      signedUrl: TEST_SIGNED_URL
    } as { [key: string]: string }
    await givenNotifySecretsAvailable()

    await callHandlerWithBody(JSON.stringify(eventBodyParams))

    expect(console.error).toHaveBeenNthCalledWith(
      1,
      'There was an error sending a request to Notify: ',
      Error('Required details were not all present in event body')
    )
    expect(NotifyClient).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenLastCalledWith(
      'Zendesk ticket update failed. No ticket ID present'
    )
  })
  it('returns from the function and logs an error when zendeskId is an empty string', async () => {
    const eventBodyParams = {
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      signedUrl: TEST_SIGNED_URL
    } as { [key: string]: string }
    await givenNotifySecretsAvailable()

    await callHandlerWithBody(JSON.stringify(eventBodyParams))

    expect(console.error).toHaveBeenNthCalledWith(
      1,
      'There was an error sending a request to Notify: ',
      Error('Required details were not all present in event body')
    )
    expect(NotifyClient).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenLastCalledWith(
      'Zendesk ticket update failed. No ticket ID present'
    )
  })
})
