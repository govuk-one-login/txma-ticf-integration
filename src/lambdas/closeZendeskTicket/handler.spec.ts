import {
  ZENDESK_TICKET_ID,
  TEST_COMMENT_COPY
} from '../../utils/tests/testConstants'
import { handler } from './handler'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { constructSqsEvent } from '../../utils/tests/events/sqsEvent'

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))
const mockUpdateZendeskTicketById = updateZendeskTicketById as jest.Mock

const givenUnsuccessfulUpdateZendeskTicket = () => {
  mockUpdateZendeskTicketById.mockImplementation(() => {
    throw new Error('An updateZendeskTicket related error')
  })
}
const validEventBody = `{
      "zendeskId": "${ZENDESK_TICKET_ID}",
      "commentCopyReference": "${TEST_COMMENT_COPY}
    }`
const callHandlerWithBody = async (customBody: string) => {
  await handler(constructSqsEvent(customBody))
}

describe('initiate closeZendeskTicket handler', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'error')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('updates zendesk ticket correct parameters', async () => {
    await callHandlerWithBody(validEventBody)

    expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      TEST_COMMENT_COPY,
      'closed'
    )
  })

  it('throws an error when no event records are in the SQSEvent object', async () => {
    await expect(handler({ Records: [] })).rejects.toThrow(
      'No records found in event'
    )
  })

  it('throws an error when no event body is present', async () => {
    const invalidEventBody = ''

    await expect(callHandlerWithBody(invalidEventBody)).rejects.toThrow(
      'Could not find event body'
    )
  })
  it('throws an error when zendeskId is missing from the event body', async () => {
    const eventBodyParams = JSON.stringify({
      commentCopyReference: 'blah'
    })

    await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
      'Zendesk ticket ID missing from event body'
    )
  })
  it('throws an error when zendeskId is an empty string', async () => {
    const eventBodyParams = JSON.stringify({
      zendeskId: '',
      commentCopyReference: TEST_COMMENT_COPY
    })

    await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
      'Zendesk ticket ID missing from event body'
    )
  })

  it('given valid event body, it logs an error when updateZendeskTicketById fails', async () => {
    givenUnsuccessfulUpdateZendeskTicket()

    await callHandlerWithBody(validEventBody)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'blah',
      'closed'
    )
    expect(console.error).toHaveBeenCalledWith(
      'Could not update Zendesk ticket: ',
      Error('An updateZendeskTicket related error')
    )
  })
})
