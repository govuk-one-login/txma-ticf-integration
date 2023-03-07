import {
  eventIsPresent,
  getCloudWatchLogEventsGroupByMessagePattern
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
          [cloudwatchLogFilters.dataSentToQueue, 'zendeskId', ticketId]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.standardTierCopy, 'zendeskId', ticketId],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

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

      const athenaQueryQueuedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('DATA_READY_FOR_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.athenaQueryQueued, 'zendeskId', ticketId],
          50
        )
      expect(athenaQueryQueuedEvents).not.toEqual([])

      const isAthenaQueryQueuedMessageInLogs = eventIsPresent(
        athenaQueryQueuedEvents,
        cloudwatchLogFilters.athenaQueryQueued
      )
      expect({
        result: isAthenaQueryQueuedMessageInLogs,
        events: athenaQueryQueuedEvents
      }).toEqual({ result: true, events: athenaQueryQueuedEvents })
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
          [cloudwatchLogFilters.dataSentToQueue, 'zendeskId', ticketId]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.glacierTierCopy, 'zendeskId', ticketId],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

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
          [cloudwatchLogFilters.dataSentToQueue, 'zendeskId', ticketId]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.mixedTierCopy, 'zendeskId', ticketId],
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
