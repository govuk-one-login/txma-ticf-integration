import { vi, type MockedFunction } from 'vitest'
import {
  ZENDESK_TICKET_ID,
  TEST_COMMENT_COPY
} from '../../../common/utils/tests/testConstants'
import { handler } from './handler'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { constructSqsEvent } from '../../../common/utils/tests/events/sqsEvent'
import { logger } from '../../../common/sharedServices/logger'
import { mockLambdaContext } from '../../../common/utils/tests/mocks/mockLambdaContext'

vi.mock('../../../common/sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: vi.fn()
}))
const mockUpdateZendeskTicketById = updateZendeskTicketById as MockedFunction<
  typeof updateZendeskTicketById
>

const givenUnsuccessfulUpdateZendeskTicket = () => {
  mockUpdateZendeskTicketById.mockImplementation(() => {
    throw new Error('An updateZendeskTicket related error')
  })
}
const validEventBody = `{
      "zendeskId": "${ZENDESK_TICKET_ID}",
      "commentCopyText": "${TEST_COMMENT_COPY}"
    }`
const callHandlerWithBody = async (customBody: string) => {
  await handler(constructSqsEvent(customBody), mockLambdaContext)
}

describe('initiate closeZendeskTicket handler', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error')
  })
  afterEach(() => {
    vi.clearAllMocks()
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
    await expect(
      handler({ Records: [] }, mockLambdaContext)
    ).rejects.toThrowError('No records found in event')
  })

  it('throws an error when no event body is present', async () => {
    const invalidEventBody = ''

    await expect(callHandlerWithBody(invalidEventBody)).rejects.toThrowError(
      'Could not find event body'
    )
  })

  it.each([
    ['zendeskId', 'Zendesk ticket ID'],
    ['commentCopyText', 'Comment copy text']
  ])(
    'throws an error when %p is missing from the event body',
    async (missingPropertyName: string, missingPropertyError: string) => {
      const eventBodyParams = {
        zendeskId: ZENDESK_TICKET_ID,
        commentCopyText: TEST_COMMENT_COPY
      } as Record<string, string>
      delete eventBodyParams[missingPropertyName]

      await expect(
        callHandlerWithBody(JSON.stringify(eventBodyParams))
      ).rejects.toThrowError(`${missingPropertyError} missing from event body`)
    }
  )
  it.each([
    ['zendeskId', 'Zendesk ticket ID'],
    ['commentCopyText', 'Comment copy text']
  ])(
    'throws an error when %p is an empty string',
    async (
      emptyStringPropertyName: string,
      emptyStringPropertyError: string
    ) => {
      const eventBodyParams = {
        zendeskId: ZENDESK_TICKET_ID,
        commentCopyText: TEST_COMMENT_COPY
      } as Record<string, string>
      eventBodyParams[emptyStringPropertyName] = ''

      await expect(
        callHandlerWithBody(JSON.stringify(eventBodyParams))
      ).rejects.toThrowError(
        `${emptyStringPropertyError} missing from event body`
      )
    }
  )

  it('given valid event body, it logs an error when updateZendeskTicketById fails', async () => {
    givenUnsuccessfulUpdateZendeskTicket()

    await callHandlerWithBody(validEventBody)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
    expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      TEST_COMMENT_COPY,
      'closed'
    )
    expect(logger.error).toHaveBeenCalledWith(
      'Could not update Zendesk ticket: ',
      Error('An updateZendeskTicket related error')
    )
  })
})
