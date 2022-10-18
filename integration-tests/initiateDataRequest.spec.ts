import { getCloudWatchLogEventsGroupByMessagePattern } from './utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import { invalidRequestData, validRequestData } from './constants/requestData'
import {
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP
} from './constants/awsParameters'
import { FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs'
import { getZendeskTicket } from './utils/zendesk/getZendeskTicket'
import { listZendeskTicketComments } from './utils/zendesk/listZendeskTicketComments'

describe('Submit a PII request with approved ticket data', () => {
  jest.setTimeout(60000)

  const CLOSE_ZENDESK_TICKET_COMMENT =
    'Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: From Date is in the future, To Date is in the future'
  const DATA_SENT_TO_QUEUE_MESSAGE = 'Sent data transfer queue message with id'
  const SQS_EVENT_RECEIVED_MESSAGE = 'Handling data request SQS event'
  const WEBHOOK_INVALID_MESSAGE = 'Zendesk request was invalid'
  const WEBHOOK_RECEIVED_MESSAGE = 'received Zendesk webhook'

  const getQueueMessageId = (logEvents: FilteredLogEvent[]) => {
    const event = logEvents.find((event) =>
      event.message?.includes(DATA_SENT_TO_QUEUE_MESSAGE)
    )

    if (!event) throw Error('Message not added to queue')

    return event.message?.split('id')[1].trim() as string
  }

  const isLogPresent = (logEvents: FilteredLogEvent[], message: string) => {
    const event = logEvents.find((event) => event.message?.includes(message))
    return event ? true : false
  }

  const isZendeskCommentPresent = async (
    ticketId: string,
    commentBody: string
  ) => {
    const ticketComments = await listZendeskTicketComments(ticketId)
    const comment = ticketComments.find((comment) =>
      comment.body.includes(commentBody)
    )
    return comment ? true : false
  }

  describe('valid requests', () => {
    let ticketId: string

    beforeEach(async () => {
      ticketId = await createZendeskTicket(validRequestData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    it('Should log a success in cloud watch if Zendesk request is valid', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', ticketId]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      expect(
        isLogPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)
      ).toEqual(true)

      const messageId = getQueueMessageId(initiateDataRequestEvents)
      console.log('messageId', messageId)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])
    })
  })

  describe('invalid requests', () => {
    let ticketId: string

    beforeEach(async () => {
      ticketId = await createZendeskTicket(invalidRequestData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    it('Should log an error in cloud watch and close ticket if zendesk request is not valid', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', ticketId]
        )

      expect(
        isLogPresent(initiateDataRequestEvents, WEBHOOK_INVALID_MESSAGE)
      ).toEqual(true)

      expect(
        isLogPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)
      ).toEqual(false)

      const zendeskTicket = await getZendeskTicket(ticketId)
      expect(zendeskTicket.status).toEqual('closed')
      expect(
        await isZendeskCommentPresent(ticketId, CLOSE_ZENDESK_TICKET_COMMENT)
      ).toEqual(true)
    })
  })
})
