import {
  assertEventNotPresent,
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from './utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import {
  invalidRequestData,
  validGlacierRequestData,
  validRequestNoData,
  validRequestData,
  validStandardAndGlacierTiersRequestData,
  setCustomFieldValueForRequest
} from './constants/requestData/dataCopyRequestData'
import {
  ANALYSIS_BUCKET_NAME,
  AUDIT_BUCKET_NAME,
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  INTEGRATION_TEST_DATE_PREFIX,
  INTEGRATION_TEST_DATE_PREFIX_GLACIER,
  INTEGRATION_TEST_DATE_PREFIX_MIX_DATA,
  INTEGRATION_TEST_DATE_PREFIX_NO_DATA,
  PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
  TEST_FILE_NAME
} from './constants/awsParameters'
import { FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs'
import { getZendeskTicket } from './utils/zendesk/getZendeskTicket'
import { listZendeskTicketComments } from './utils/zendesk/listZendeskTicketComments'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from './utils/aws/s3DeleteAuditDataWithPrefix'
import { appendRandomIdToFilename } from './utils/helpers'
import { ZendeskFormFieldIDs } from './constants/zendeskParameters'

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
  const GLACIER_TIER_OBJECTS_TO_COPY_MESSAGE =
    'Number of standard tier files to copy was 0, glacier tier files to copy was 1'
  const MIX_TIER_OBJECTS_TO_COPY_MESSAGE =
    'Number of standard tier files to copy was 1, glacier tier files to copy was 1'
  const S3_COPY_JOB_STARTED_MESSAGE =
    'Started S3 copy job for zendesk ticket with id'
  const S3_GLACIER_RESTORE_STARTED_MESSAGE =
    'Started Glacier restore for zendesk ticket with id'
  const SQS_EVENT_RECEIVED_MESSAGE = 'Handling data request SQS event'
  const WEBHOOK_INVALID_MESSAGE = 'Zendesk request was invalid'
  const WEBHOOK_RECEIVED_MESSAGE = 'received Zendesk webhook'

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

  describe('valid requests for standard copy - analysis bucket empty', () => {
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
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}/01/${TEST_FILE_NAME}`,
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

  describe('valid requests for glacier copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      await deleteAuditDataWithPrefix(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_GLACIER}`
      )
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_GLACIER}`
      )
      await copyAuditDataFromTestDataBucket(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_GLACIER}/01/${appendRandomIdToFilename(
          TEST_FILE_NAME
        )}`,
        TEST_FILE_NAME,
        'GLACIER'
      )
      ticketId = await createZendeskTicket(validGlacierRequestData)
      await approveZendeskTicket(ticketId)
    })

    test('request for valid data all in glacier tier', async () => {
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
        GLACIER_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      assertEventPresent(
        processDataRequestEvents,
        S3_GLACIER_RESTORE_STARTED_MESSAGE
      )
    })
  })

  describe('valid requests for standard and glacier copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      await deleteAuditDataWithPrefix(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_MIX_DATA}`
      )
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_MIX_DATA}`
      )
      await copyAuditDataFromTestDataBucket(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_MIX_DATA}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'GLACIER'
      )
      await copyAuditDataFromTestDataBucket(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_MIX_DATA}/02/${TEST_FILE_NAME}`,
        TEST_FILE_NAME
      )
      ticketId = await createZendeskTicket(
        validStandardAndGlacierTiersRequestData
      )
      await approveZendeskTicket(ticketId)
    })

    test('valid request with data in standard and glacier tier', async () => {
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
        MIX_TIER_OBJECTS_TO_COPY_MESSAGE
      )
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
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME
      )
      await copyAuditDataFromTestDataBucket(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX}/01/${TEST_FILE_NAME}`,
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

  describe('valid requests for no data copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      await deleteAuditDataWithPrefix(
        AUDIT_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_NO_DATA}`
      )
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${INTEGRATION_TEST_DATE_PREFIX_NO_DATA}`
      )
      ticketId = await createZendeskTicket(validRequestNoData)
      await approveZendeskTicket(ticketId)
    })

    test('request for valid data, no files present', async () => {
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

  describe('invalid recipient email', () => {
    let ticketId: string

    beforeEach(async () => {
      const ticketData = { ...validRequestData }
      setCustomFieldValueForRequest(
        ticketData,
        ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        'txma-team2-bogus-ticf-analyst-dev@test.gov.uk'
      )
      ticketId = await createZendeskTicket(ticketData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    test('recipient email not in approved list should not start data retrieval process, and should close ticket', async () => {
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
      await assertZendeskCommentPresent(
        ticketId,
        'Recipient email not in valid recipient list'
      )
    })
  })
})
