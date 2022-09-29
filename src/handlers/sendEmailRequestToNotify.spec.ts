import { defaultApiRequest } from '../utils/tests/events/defaultApiRequest'
import {
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  TEST_SIGNED_URL,
  ZENDESK_TICKET_ID
} from '../utils/tests/testConstants'
import { handler } from './sendEmailRequestToNotify'
import { updateZendeskTicketById } from '../services/updateZendeskTicket'
import { sendEmailToNotify } from '../services/sendEmailRequestToNotify'

jest.mock('../services/sendEmailRequestToNotify', () => ({
  sendEmailToNotify: jest.fn()
}))
jest.mock('../services/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))
const mockUpdateZendeskTicketById = updateZendeskTicketById as jest.Mock
const mockSendEmailToNotify = sendEmailToNotify as jest.Mock
const givenUnsuccessfulSendEmailToNotify = () => {
  mockSendEmailToNotify.mockImplementation(() => {
    throw new Error('A Notify related error')
  })
}
const givenUnsuccessfulUpdateZendeskTicket = () => {
  mockUpdateZendeskTicketById.mockImplementation(() => {
    throw new Error('An updateZendeskTicket related error')
  })
}
const validEventBody = `{
      "email": "${TEST_NOTIFY_EMAIL}",
      "firstName": "${TEST_NOTIFY_NAME}",
      "zendeskId": "${ZENDESK_TICKET_ID}",
      "signedUrl": "${TEST_SIGNED_URL}"
    }`
const callHandlerWithBody = async (customBody: string) => {
  await handler({
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

    await callHandlerWithBody(validEventBody)

    expect(mockSendEmailToNotify).toHaveBeenCalledWith({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      zendeskId: ZENDESK_TICKET_ID,
      signedUrl: TEST_SIGNED_URL
    })
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'A link to your results has been sent to you.',
      'closed'
    )
  })
  it('given a valid event body, when sendEmailToNotify fails, logs an error and calls closeZendeskTicket', async () => {
    givenUnsuccessfulSendEmailToNotify()

    await callHandlerWithBody(validEventBody)

    expect(console.error).toHaveBeenCalledWith(
      'Could not send a request to Notify: ',
      Error('A Notify related error')
    )
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'Your results could not be emailed.',
      'closed'
    )
  })
  it('returns from the function and logs an error when no event body is present', async () => {
    const invalidEventBody = ''

    await expect(callHandlerWithBody(invalidEventBody)).rejects.toThrow(
      'Could not find event body. An email has not been sent'
    )
  })
  it.each(['firstName', 'email', 'signedUrl'])(
    'updates Zendesk ticket, and logs an error when %p is missing from the event body',
    async (missingPropertyName: string) => {
      const eventBodyParams = {
        email: TEST_NOTIFY_EMAIL,
        firstName: TEST_NOTIFY_NAME,
        signedUrl: TEST_SIGNED_URL,
        zendeskId: ZENDESK_TICKET_ID
      } as { [key: string]: string }
      delete eventBodyParams[missingPropertyName]

      await callHandlerWithBody(JSON.stringify(eventBodyParams))

      expect(console.error).toHaveBeenLastCalledWith(
        'Could not send a request to Notify: ',
        Error('Required details were not all present in event body')
      )
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

      await callHandlerWithBody(JSON.stringify(eventBodyParams))

      expect(console.error).toHaveBeenLastCalledWith(
        'Could not send a request to Notify: ',
        Error('Required details were not all present in event body')
      )
      expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
        ZENDESK_TICKET_ID,
        'Your results could not be emailed.',
        'closed'
      )
    }
  )
  it('logs an error when updateZendeskTicketById fails', async () => {
    givenUnsuccessfulUpdateZendeskTicket()

    await callHandlerWithBody(validEventBody)
    expect(mockSendEmailToNotify).toHaveBeenCalledWith({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      zendeskId: ZENDESK_TICKET_ID,
      signedUrl: TEST_SIGNED_URL
    })
    expect(console.error).toHaveBeenCalledWith(
      'Could not update Zendesk ticket: ',
      Error('An updateZendeskTicket related error')
    )
  })
  it('throws an error when zendeskId is missing from the event body', async () => {
    const eventBodyParams = JSON.stringify({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      signedUrl: TEST_SIGNED_URL
    })

    await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
      'Zendesk ticket ID missing from event body'
    )
  })
  it('throws an error when zendeskId is an empty string', async () => {
    const eventBodyParams = JSON.stringify({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      signedUrl: TEST_SIGNED_URL,
      zendeskId: ''
    })

    await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
      'Zendesk ticket ID missing from event body'
    )
  })
})
