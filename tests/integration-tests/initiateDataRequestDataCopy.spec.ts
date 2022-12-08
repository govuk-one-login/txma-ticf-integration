import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../shared-test-code/utils/aws/cloudWatchGetLogs'
import {
  ANALYSIS_BUCKET_NAME,
  AUDIT_BUCKET_NAME,
  DATA_SENT_TO_QUEUE_MESSAGE,
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  INTEGRATION_TEST_DATE_PREFIX,
  INTEGRATION_TEST_DATE_PREFIX_GLACIER,
  INTEGRATION_TEST_DATE_PREFIX_MIX_DATA,
  PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
  SQS_EVENT_RECEIVED_MESSAGE,
  TEST_FILE_NAME,
  WEBHOOK_RECEIVED_MESSAGE
} from '../shared-test-code/constants/awsParameters'
import { copyAuditDataFromTestDataBucket } from '../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { deleteAuditDataWithPrefix } from '../shared-test-code/utils/aws/s3DeleteAuditDataWithPrefix'
import { appendRandomIdToFilename } from '../shared-test-code/utils/helpers'
import { sendWebhookRequest } from '../shared-test-code/utils/zendesk/sendWebhookRequest'
import { getTicketDetailsForId } from '../shared-test-code/utils/zendesk/getTicketDetailsForId'

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
      const defaultWebhookRequestData = getTicketDetailsForId(1)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    afterEach(async () => {
      console.log('request for valid data all in standard tier test ended')
    })

    it('request for valid data all in standard tier', async () => {
      console.log('request for valid data all in standard tier test started')
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
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isStandardTierObjectsToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        STANDARD_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      expect(isStandardTierObjectsToCopyMessageInLogs).toBeTrue()

      const isCopyJobStartedMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        S3_COPY_JOB_STARTED_MESSAGE
      )
      expect(isCopyJobStartedMessageInLogs).toBeTrue()

      const copyCompletedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [COPY_COMPLETE_MESSAGE, 'zendeskId', ticketId],
          100
        )
      expect(copyCompletedEvents).not.toEqual([])

      const isCopyCompleteMessageInLogs = assertEventPresent(
        copyCompletedEvents,
        COPY_COMPLETE_MESSAGE
      )
      expect(isCopyCompleteMessageInLogs).toBeTrue()
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
      const defaultWebhookRequestData = getTicketDetailsForId(3)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    afterEach(async () => {
      console.log('request for valid data all in glacier tier test ended')
    })

    it.only('request for valid data all in glacier tier', async () => {
      console.log('request for valid data all in glacier tier test started')

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
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isGlacierTierObjectCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        GLACIER_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      expect(isGlacierTierObjectCopyMessageInLogs).toBeTrue()

      const isGlacierRestoreStartedMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        S3_GLACIER_RESTORE_STARTED_MESSAGE
      )
      expect(isGlacierRestoreStartedMessageInLogs).toBeTrue()
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
      const defaultWebhookRequestData = getTicketDetailsForId(4)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    afterEach(async () => {
      console.log(
        'valid request with data in standard and glacier tier test ended'
      )
    })

    it('valid request with data in standard and glacier tier', async () => {
      console.log(
        'valid request with data in standard and glacier tier test started'
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
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isMixTierObjectsToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        MIX_TIER_OBJECTS_TO_COPY_MESSAGE
      )
      expect(isMixTierObjectsToCopyMessageInLogs).toBeTrue()
    })
  })
})
