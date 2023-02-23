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
      expect({
        result: isDataSentToQueueMessageInLogs,
        events: initiateDataRequestEvents
      }).toEqual({ result: true, events: initiateDataRequestEvents })

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
      expect({
        result: isStandardTierObjectsToCopyMessageInLogs,
        events: processDataRequestEvents
      }).toEqual({ result: true, events: processDataRequestEvents })
      const isCopyJobStartedMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        getFeatureFlagValue('DECRYPT_DATA')
          ? cloudwatchLogFilters.decryptStarted
          : cloudwatchLogFilters.copyStarted
      )
      expect({
        result: isCopyJobStartedMessageInLogs,
        events: processDataRequestEvents
      }).toEqual({ result: true, events: processDataRequestEvents })
      // TODO: look for an entry in the dataReadyForQuery lambda logs instead
      // const copyCompletedEvents =
      //   await getCloudWatchLogEventsGroupByMessagePattern(
      //     getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
      //     [cloudwatchLogFilters.copyComplete, 'zendeskId', ticketId],
      //     100
      //   )
      // expect(copyCompletedEvents).not.toEqual([])

      // const isCopyCompleteMessageInLogs = eventIsPresent(
      //   copyCompletedEvents,
      //   cloudwatchLogFilters.copyComplete
      // )
      // expect({
      //   result: isCopyCompleteMessageInLogs,
      //   events: copyCompletedEvents
      // }).toEqual({ result: true, events: copyCompletedEvents })
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
      expect({
        result: isDataSentToQueueMessageInLogs,
        events: initiateDataRequestEvents
      }).toEqual({ result: true, events: initiateDataRequestEvents })

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
      expect({
        result: isGlacierTierObjectCopyMessageInLogs,
        events: processDataRequestEvents
      }).toEqual({ result: true, events: processDataRequestEvents })

      const isGlacierRestoreStartedMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.restoreStarted
      )
      expect({
        result: isGlacierRestoreStartedMessageInLogs,
        events: processDataRequestEvents
      }).toEqual({ result: true, events: processDataRequestEvents })
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
      expect({
        result: isDataSentToQueueMessageInLogs,
        events: initiateDataRequestEvents
      }).toEqual({ result: true, events: initiateDataRequestEvents })

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
      expect({
        result: isMixTierObjectsToCopyMessageInLogs,
        events: processDataRequestEvents
      }).toEqual({ result: true, events: processDataRequestEvents })
    })
  })
})
