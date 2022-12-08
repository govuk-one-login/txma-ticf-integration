import {
  ANALYSIS_BUCKET_NAME,
  AUDIT_BUCKET_NAME,
  DATA_SENT_TO_QUEUE_MESSAGE,
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  INTEGRATION_TEST_DATE_PREFIX,
  INTEGRATION_TEST_DATE_PREFIX_NO_DATA,
  PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
  SQS_EVENT_RECEIVED_MESSAGE,
  TEST_FILE_NAME,
  WEBHOOK_RECEIVED_MESSAGE
} from '../shared-test-code/constants/awsParameters'
import {
  validRequestData,
  validRequestNoData
} from '../shared-test-code/constants/requestData/dataCopyRequestData'
import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from '../shared-test-code/utils/aws/s3DeleteAuditDataWithPrefix'
import { approveZendeskTicket } from '../shared-test-code/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../shared-test-code/utils/zendesk/createZendeskTicket'
import { deleteZendeskTicket } from '../shared-test-code/utils/zendesk/deleteZendeskTicket'

const NOTHING_TO_COPY_MESSAGE =
  'Number of standard tier files to copy was 0, glacier tier files to copy was 0'
const DATA_AVAILABLE_MESSAGE = 'All data available, queuing Athena query'

describe('Data should not be copied to analysis bucket', () => {
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

    afterEach(async () => {
      console.log('request for valid data, no files present test ended')
    })

    test('request for valid data, no files present', async () => {
      console.log('request for valid data, no files present test started')
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )
      expect(isDataSentToQueueMessageInLogs).toBeTrue()

      const messageId = getQueueMessageId(initiateDataRequestEvents)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isNothingToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        NOTHING_TO_COPY_MESSAGE
      )
      expect(isNothingToCopyMessageInLogs).toBeTrue()
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
      console.log(
        'request for valid data already in analysis bucket test ended'
      )
    })

    test('request for valid data already in analysis bucket', async () => {
      console.log(
        'request for valid data already in analysis bucket test started'
      )
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )
      expect(isDataSentToQueueMessageInLogs).toBeTrue()

      const messageId = getQueueMessageId(initiateDataRequestEvents)
      console.log('messageId', messageId)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isNothingToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        NOTHING_TO_COPY_MESSAGE
      )
      expect(isNothingToCopyMessageInLogs).toBeTrue()

      const isDataAvailableMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        DATA_AVAILABLE_MESSAGE
      )
      expect(isDataAvailableMessageInLogs).toBeTrue()
    })
  })
})
