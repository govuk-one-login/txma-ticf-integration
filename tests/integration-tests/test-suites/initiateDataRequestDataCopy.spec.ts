import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { testData } from '../constants/testData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../utils/getWebhookRequestDataForTestCaseNumberAndDate'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'

describe('Data should be copied to analysis bucket', () => {
  describe('valid requests for standard copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${testData.dataCopyTestFileName}`,
        testData.dataCopyTestFileName,
        'STANDARD',
        true
      )
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(1, availableDate.date)
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
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )
      expect(isDataSentToQueueMessageInLogs).toBe(true)

      const messageId = getQueueMessageId(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.sqsEventReceived, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isStandardTierObjectsToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.standardTierCopy
      )
      expect(isStandardTierObjectsToCopyMessageInLogs).toBe(true)
      const isCopyJobStartedMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.copyStarted
      )
      expect(isCopyJobStartedMessageInLogs).toBe(true)

      const copyCompletedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.copyComplete, 'zendeskId', ticketId],
          100
        )
      expect(copyCompletedEvents).not.toEqual([])

      const isCopyCompleteMessageInLogs = assertEventPresent(
        copyCompletedEvents,
        cloudwatchLogFilters.copyComplete
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
        `${availableDate.prefix}/01/${testData.dataCopyTestFileName}`,
        testData.dataCopyTestFileName,
        'GLACIER',
        true
      )
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(3, availableDate.date)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data all in glacier tier', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )
      expect(isDataSentToQueueMessageInLogs).toBe(true)

      const messageId = getQueueMessageId(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.sqsEventReceived, 'messageId', messageId],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isGlacierTierObjectCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.glacierTierCopy
      )
      expect(isGlacierTierObjectCopyMessageInLogs).toBe(true)

      const isGlacierRestoreStartedMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.restoreStarted
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
        `${availableDate.prefix}/01/${testData.dataCopyTestFileName}`,
        testData.dataCopyTestFileName,
        'GLACIER',
        true
      )

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/02/${testData.dataCopyTestFileName}`,
        testData.dataCopyTestFileName,
        'STANDARD',
        true
      )
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(4, availableDate.date)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data in standard and glacier tier', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )
      expect(isDataSentToQueueMessageInLogs).toBe(true)

      const messageId = getQueueMessageId(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.sqsEventReceived, 'messageId', messageId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      const isMixTierObjectsToCopyMessageInLogs = assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.mixedTierCopy
      )
      expect(isMixTierObjectsToCopyMessageInLogs).toBe(true)
    })
  })
})
