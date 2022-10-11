import { defaultApiRequest } from '../../utils/tests/events/defaultApiRequest'
import {
  TEST_NOTIFY_EMAIL,
  TEST_NOTIFY_NAME,
  TEST_SIGNED_URL,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { handler } from './handler'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { sendEmailToNotify } from './sendEmailToNotify'
import { notifyCopy } from '../../constants/notifyCopy'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
import { loggingCopy } from '../../constants/loggingCopy'

jest.mock('./sendEmailToNotify', () => ({
  sendEmailToNotify: jest.fn()
}))
jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
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
    await callHandlerWithBody(validEventBody)

    expect(mockSendEmailToNotify).toHaveBeenCalledWith({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      zendeskId: ZENDESK_TICKET_ID,
      signedUrl: TEST_SIGNED_URL
    })
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      interpolateTemplate('linkToResults', notifyCopy),
      'closed'
    )
  })
  it('throws an error when no event body is present', async () => {
    const invalidEventBody = ''

    await expect(callHandlerWithBody(invalidEventBody)).rejects.toThrow(
      interpolateTemplate('missingEventBody', notifyCopy)
    )
  })
  it('throws an error when zendeskId is missing from the event body', async () => {
    const eventBodyParams = JSON.stringify({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      signedUrl: TEST_SIGNED_URL
    })

    await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
      interpolateTemplate('zendeskTicketIdMissing', notifyCopy)
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
      interpolateTemplate('zendeskTicketIdMissing', notifyCopy)
    )
  })
  it.each(['firstName', 'email', 'signedUrl'])(
    'updates Zendesk ticket, and throws an error when %p is missing from the event body',
    async (missingPropertyName: string) => {
      const eventBodyParams = {
        email: TEST_NOTIFY_EMAIL,
        firstName: TEST_NOTIFY_NAME,
        signedUrl: TEST_SIGNED_URL,
        zendeskId: ZENDESK_TICKET_ID
      } as { [key: string]: string }
      delete eventBodyParams[missingPropertyName]

      await expect(
        callHandlerWithBody(JSON.stringify(eventBodyParams))
      ).rejects.toThrow(
        interpolateTemplate('requiredDetailsMissing', notifyCopy)
      )
      expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
      expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
        ZENDESK_TICKET_ID,
        interpolateTemplate('resultNotEmailed', notifyCopy),
        'closed'
      )
    }
  )
  it.each(['firstName', 'email', 'signedUrl'])(
    'updates Zendesk ticket, and throws an error when %p is an empty string',
    async (emptyStringPropertyName: string) => {
      const eventBodyParams = {
        email: TEST_NOTIFY_EMAIL,
        firstName: TEST_NOTIFY_NAME,
        signedUrl: TEST_SIGNED_URL,
        zendeskId: ZENDESK_TICKET_ID
      } as { [key: string]: string }
      eventBodyParams[emptyStringPropertyName] = ''

      await expect(
        callHandlerWithBody(JSON.stringify(eventBodyParams))
      ).rejects.toThrow(
        interpolateTemplate('requiredDetailsMissing', notifyCopy)
      )
      expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
      expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
        ZENDESK_TICKET_ID,
        interpolateTemplate('resultNotEmailed', notifyCopy),
        'closed'
      )
    }
  )
  it('given a valid event body, when sendEmailToNotify fails, logs an error and calls closeZendeskTicket', async () => {
    givenUnsuccessfulSendEmailToNotify()

    await callHandlerWithBody(validEventBody)

    expect(console.error).toHaveBeenCalledWith(
      interpolateTemplate('requestNotSentToNotify', loggingCopy),
      Error('A Notify related error')
    )
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      interpolateTemplate('resultNotEmailed', notifyCopy),
      'closed'
    )
  })
  it('given valid event body and Notify request was successful, it logs an error when updateZendeskTicketById fails', async () => {
    givenUnsuccessfulUpdateZendeskTicket()

    await callHandlerWithBody(validEventBody)
    expect(mockSendEmailToNotify).toHaveBeenCalledWith({
      email: TEST_NOTIFY_EMAIL,
      firstName: TEST_NOTIFY_NAME,
      zendeskId: ZENDESK_TICKET_ID,
      signedUrl: TEST_SIGNED_URL
    })
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      interpolateTemplate('resultNotEmailed', notifyCopy),
      'closed'
    )
    expect(console.error).toHaveBeenCalledWith(
      interpolateTemplate('ticketNotUpdated', loggingCopy),
      Error('An updateZendeskTicket related error')
    )
  })
  it('given a valid event body, when sendEmailToNotify and updateZendeskTicketById fails, both errors are logged', async () => {
    givenUnsuccessfulSendEmailToNotify()
    givenUnsuccessfulUpdateZendeskTicket()

    await callHandlerWithBody(validEventBody)

    expect(console.error).toHaveBeenCalledTimes(2)
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      interpolateTemplate('requestNotSentToNotify', loggingCopy),
      Error('A Notify related error')
    )
    expect(console.error).toHaveBeenLastCalledWith(
      interpolateTemplate('ticketNotUpdated', loggingCopy),
      Error('An updateZendeskTicket related error')
    )
  })
})
