import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { getEnv } from '../../shared-test-code/utils/helpers'
import {
  DATA_SENT_TO_QUEUE_MESSAGE,
  SQS_EVENT_RECEIVED_MESSAGE,
  WEBHOOK_RECEIVED_MESSAGE
} from '../constants/cloudWatchLogMessages'
import { TEST_FILE_NAME } from '../constants/testData'
import { getTicketDetailsForId } from '../../shared-test-code/utils/zendesk/getTicketDetailsForId'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'

const NOTHING_TO_COPY_MESSAGE =
  'Number of standard tier files to copy was 0, glacier tier files to copy was 0'
const DATA_AVAILABLE_MESSAGE = 'All data available, queuing Athena query'

describe('Data should not be copied to analysis bucket', () => {
  describe('valid requests for no data copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const defaultWebhookRequestData = getTicketDetailsForId(5)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('request for valid data, no files present', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )
      expect(isDataSentToQueueMessageInLogs).toBe(true)

      const messageId = getQueueMessageId(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isNothingToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        NOTHING_TO_COPY_MESSAGE
      )
      expect(isNothingToCopyMessageInLogs).toBe(true)
    })
  })

  describe('valid requests - data present in analysis bucket', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'STANDARD',
        true
      )
      await copyAuditDataFromTestDataBucket(
        getEnv('ANALYSIS_BUCKET_NAME'),
        `${availableDate.prefix}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'STANDARD',
        true
      )
      const defaultWebhookRequestData = getTicketDetailsForId(1)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('request for valid data already in analysis bucket', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )
      expect(isDataSentToQueueMessageInLogs).toBe(true)

      const messageId = getQueueMessageId(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isNothingToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        NOTHING_TO_COPY_MESSAGE
      )
      expect(isNothingToCopyMessageInLogs).toBe(true)

      const isDataAvailableMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        DATA_AVAILABLE_MESSAGE
      )
      expect(isDataAvailableMessageInLogs).toBe(true)
    })
  })
})
