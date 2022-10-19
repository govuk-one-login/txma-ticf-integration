import { getCloudWatchLogEventsGroupByMessagePattern } from './utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import { invalidRequestData, validRequestData } from './constants/requestData'
import {
  ANALYSIS_BUCKET_NAME,
  AUDIT_BUCKET_NAME,
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  INTEGRATION_TEST_DATE_PREFIX,
  PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
  TEST_FILE_NAME
} from './constants/awsParameters'
import { FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs'
import { getZendeskTicket } from './utils/zendesk/getZendeskTicket'
import { listZendeskTicketComments } from './utils/zendesk/listZendeskTicketComments'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from './utils/aws/s3DeleteAuditDataWithPrefix'

describe('Submit a PII request with approved ticket data', () => {
  jest.setTimeout(90000)

  const COPY_COMPLETE_MESSAGE = 'Restore/copy process complete.'
  const CLOSE_ZENDESK_TICKET_COMMENT =
    'Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: From Date is in the future, To Date is in the future'
  const DATA_AVAILABLE_MESSAGE = 'All data available, queuing Athena query'
  const DATA_SENT_TO_QUEUE_MESSAGE = 'Sent data transfer queue message with id'
  const NOTHING_TO_COPY_MESSAGE =
    'Number of standard tier files to copy was 0, glacier tier files to copy was 0'
  const STANDARD_TIER_OBJECTS_TO_COPY_MESSAGE =
    'Number of standard tier files to copy was 1, glacier tier files to copy was 0'
  const S3_COPY_JOB_STARTED_MESSAGE =
    'Started S3 copy job for zendesk ticket with id'
  const SQS_EVENT_RECEIVED_MESSAGE = 'Handling data request SQS event'
  const WEBHOOK_INVALID_MESSAGE = 'Zendesk request was invalid'
  const WEBHOOK_RECEIVED_MESSAGE = 'received Zendesk webhook'

  const assertEventPresent = (
    logEvents: FilteredLogEvent[],
    message: string
  ) => {
    const eventPresent = logEvents.some((event) =>
      event.message?.includes(message)
    )
    console.log('message', message)
    expect(eventPresent).toEqual(true)
  }

  const assertEventNotPresent = (
    logEvents: FilteredLogEvent[],
    message: string
  ) => {
    const eventPresent = logEvents.some((event) =>
      event.message?.includes(message)
    )
    console.log('message', message)
    expect(eventPresent).toEqual(false)
  }

  const assertZendeskCommentPresent = async (
    ticketId: string,
    commentBody: string
  ) => {
    const ticketComments = await listZendeskTicketComments(ticketId)
    const commentPresent = ticketComments.some((comment) =>
      comment.body.includes(commentBody)
    )
    console.log('commentBody', commentBody)
    expect(commentPresent).toEqual(true)
  }

  const getQueueMessageId = (logEvents: FilteredLogEvent[]) => {
    const event = logEvents.find((event) =>
      event.message?.includes(DATA_SENT_TO_QUEUE_MESSAGE)
    )

    if (!event || !event.message) throw Error('Message not added to queue')

    return event.message?.split('id')[1].trim()
  }

  describe('valid requests - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      await deleteAuditDataWithPrefix(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}`
      )
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}`
      )
      await copyAuditDataFromTestDataBucket(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}/01/`,
        TEST_FILE_NAME
      )
      ticketId = await createZendeskTicket(validRequestData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    test('request for valid data all in standard tier', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', ticketId]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      assertEventPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)

      const messageId = getQueueMessageId(initiateDataRequestEvents)
      console.log('messageId', messageId)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(
        processDataRequestEvents,
        STANDARD_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      assertEventPresent(processDataRequestEvents, S3_COPY_JOB_STARTED_MESSAGE)

      const copyCompletedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [COPY_COMPLETE_MESSAGE, 'zendeskId', ticketId],
          100
        )
      expect(copyCompletedEvents).not.toEqual([])

      assertEventPresent(copyCompletedEvents, NOTHING_TO_COPY_MESSAGE)
      assertEventPresent(copyCompletedEvents, COPY_COMPLETE_MESSAGE)
    })
  })

  describe('valid requests - data present in analysis bucket', () => {
    let ticketId: string

    beforeEach(async () => {
      await deleteAuditDataWithPrefix(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}`
      )
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}`
      )
      await copyAuditDataFromTestDataBucket(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}/01/`,
        TEST_FILE_NAME
      )
      await copyAuditDataFromTestDataBucket(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}/01/`,
        TEST_FILE_NAME
      )
      ticketId = await createZendeskTicket(validRequestData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    test('request for valid data already in analysis bucket', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', ticketId]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      assertEventPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)

      const messageId = getQueueMessageId(initiateDataRequestEvents)

      console.log('messageId', messageId)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(processDataRequestEvents, NOTHING_TO_COPY_MESSAGE)
      assertEventPresent(processDataRequestEvents, DATA_AVAILABLE_MESSAGE)
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

    test('invalid data should not start data retrieval process, and should close ticket', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', ticketId]
        )

      assertEventPresent(initiateDataRequestEvents, WEBHOOK_INVALID_MESSAGE)
      assertEventNotPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )

      const zendeskTicket = await getZendeskTicket(ticketId)
      expect(zendeskTicket.status).toEqual('closed')
      await assertZendeskCommentPresent(ticketId, CLOSE_ZENDESK_TICKET_COMMENT)
    })
  })
})