import {
  eventIsPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import {
  getEnv,
  getFeatureFlagValue
} from '../../shared-test-code/utils/helpers'
import { testData } from '../constants/testData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../utils/getWebhookRequestDataForTestCaseNumberAndDate'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'
import { setupAuditSourceTestData } from '../../shared-test-code/utils/aws/setupAuditSourceTestData'

describe('Data should be copied to analysis bucket', () => {
  describe('valid requests for standard copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()
      await setupAuditSourceTestData(
        testData.dataCopyTestFileName,
        `${availableDate.prefix}/01`,
        false
      )
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(1, availableDate.date)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data all in standard tier', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const isDataSentToQueueMessageInLogs = eventIsPresent(
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

      const isStandardTierObjectsToCopyMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.standardTierCopy
      )
      expect(isStandardTierObjectsToCopyMessageInLogs).toBe(true)

      const isCopyOrDecryptJobStartedMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        getFeatureFlagValue('DECRYPT_DATA')
          ? cloudwatchLogFilters.decryptStarted
          : cloudwatchLogFilters.copyStarted
      )
      expect(isCopyOrDecryptJobStartedMessageInLogs).toBe(true)

      const copyCompletedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.copyComplete, 'zendeskId', ticketId],
          100
        )
      expect(copyCompletedEvents).not.toEqual([])

      const isCopyCompleteMessageInLogs = eventIsPresent(
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
      await setupAuditSourceTestData(
        testData.dataCopyTestFileName,
        `${availableDate.prefix}/01`,
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

      const isDataSentToQueueMessageInLogs = eventIsPresent(
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

      const isGlacierTierObjectCopyMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.glacierTierCopy
      )
      expect(isGlacierTierObjectCopyMessageInLogs).toBe(true)

      const isGlacierRestoreStartedMessageInLogs = eventIsPresent(
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

      await setupAuditSourceTestData(
        testData.dataCopyTestFileName,
        `${availableDate.prefix}/01`,
        true
      )
      await setupAuditSourceTestData(
        testData.dataCopyTestFileName,
        `${availableDate.prefix}/02`
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

      const isDataSentToQueueMessageInLogs = eventIsPresent(
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

      const isMixTierObjectsToCopyMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.mixedTierCopy
      )
      expect(isMixTierObjectsToCopyMessageInLogs).toBe(true)
    })
  })
})
