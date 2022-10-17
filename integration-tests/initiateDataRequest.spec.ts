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
import { showZendeskTicket } from './utils/zendesk/showZendeskTicket'

describe('Submit a PII request with approved ticket data', () => {
  jest.setTimeout(60000)

  const DATA_SENT_TO_QUEUE_MESSAGE = 'Sent data transfer queue message with id'
  const SQS_EVENT_RECEIVED_MESSAGE = 'Handling data request SQS event'
  const WEBHOOK_INVALID_MESSAGE = 'Zendesk request was invalid'
  const WEBHOOK_RECEIVED_MESSAGE = 'received Zendesk webhook'

  const isLogPresent = (logEvents: FilteredLogEvent[], message: string) => {
    const event = logEvents.find((event) => event.message?.includes(message))
    return event ? true : false
  }

  const getQueueMessageId = (logEvents: FilteredLogEvent[]) => {
    const event = logEvents.find((event) =>
      event.message?.includes(DATA_SENT_TO_QUEUE_MESSAGE)
    )
    return event?.message?.split('id')[1].trim()
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

      expect(
        isLogPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)
      ).toEqual(true)

      const messageId = getQueueMessageId(initiateDataRequestEvents)

      if (messageId) {
        console.log('messageId', messageId)
        const processDataRequestEvents =
          await getCloudWatchLogEventsGroupByMessagePattern(
            PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
            [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
            50
          )
        console.log(processDataRequestEvents)
        expect(processDataRequestEvents).not.toEqual([])
      }
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

    it('Should log an error in cloud watch if zendesk request is not valid', async () => {
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

      const zendeskTicket = await showZendeskTicket(ticketId)
      expect(zendeskTicket.ticket.status).toEqual('closed')
    })
  })
})
