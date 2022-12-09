import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'
import { getTicketDetailsForId } from '../../shared-test-code/utils/zendesk/getTicketDetailsForId'
import {
  DATA_SENT_TO_QUEUE_MESSAGE,
  SQS_EVENT_RECEIVED_MESSAGE,
  WEBHOOK_RECEIVED_MESSAGE
} from '../constants/cloudWatchLogMessages'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { TEST_FILE_NAME } from '../constants/testData'

describe('Data should be copied to analysis bucket', () => {
  const COPY_COMPLETE_MESSAGE = 'Restore/copy process complete.'

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

  describe('standard copy - analysis bucket empty', () => {
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
      const defaultWebhookRequestData = getTicketDetailsForId(
        1,
        availableDate.date
      )
      ticketId = defaultWebhookRequestData.zendeskId
      console.log(
        `using test date ${availableDate.date} and zendeskId ${ticketId}`
      )
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data all in standard tier', async () => {
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

      const isStandardTierObjectsToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        STANDARD_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      expect(isStandardTierObjectsToCopyMessageInLogs).toBe(true)

      const isCopyJobStartedMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        S3_COPY_JOB_STARTED_MESSAGE
      )
      expect(isCopyJobStartedMessageInLogs).toBe(true)

      const copyCompletedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [COPY_COMPLETE_MESSAGE, 'zendeskId', ticketId],
          100
        )
      expect(copyCompletedEvents).not.toEqual([])

      const isCopyCompleteMessageInLogs = assertEventPresent(
        copyCompletedEvents,
        COPY_COMPLETE_MESSAGE
      )
      expect(isCopyCompleteMessageInLogs).toBe(true)
    })
  })

  describe('glacier copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'GLACIER',
        true
      )
      const defaultWebhookRequestData = getTicketDetailsForId(
        3,
        availableDate.date
      )
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data all in glacier tier', async () => {
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

      const isGlacierTierObjectCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        GLACIER_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      expect(isGlacierTierObjectCopyMessageInLogs).toBe(true)

      const isGlacierRestoreStartedMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        S3_GLACIER_RESTORE_STARTED_MESSAGE
      )
      expect(isGlacierRestoreStartedMessageInLogs).toBe(true)
    })
  })

  describe('standard and glacier copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'GLACIER',
        true
      )

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/02/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'STANDARD',
        true
      )
      const defaultWebhookRequestData = getTicketDetailsForId(
        4,
        availableDate.date
      )
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data in standard and glacier tier', async () => {
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

      const isMixTierObjectsToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        MIX_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      expect(isMixTierObjectsToCopyMessageInLogs).toBe(true)
    })
  })
})
