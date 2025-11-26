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
import { deleteDynamoDBTestItem } from '../../shared-test-code/utils/aws/dynamoDB'
import { waitForAuditFileRestore } from '../../shared-test-code/utils/aws/glacierRestoreCheck/waitForAuditFileRestore'

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
          [
            cloudwatchLogFilters.athenaQueryQueued,
            cloudwatchLogFilters.zendeskId,
            ticketId
          ],
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

  describe('glacier IR copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()
      await setupAuditSourceTestData(
        testData.dataCopyTestFileName,
        `${availableDate.prefix}/01`,
        true
      )
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(2, availableDate.date)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('data all in glacier IR tier', async () => {
      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.glacierIRTierCopy,
            cloudwatchLogFilters.zendeskId,
            ticketId
          ],
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
          [
            cloudwatchLogFilters.athenaQueryQueued,
            cloudwatchLogFilters.zendeskId,
            ticketId
          ],
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
    let testDataFileKey: string
    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()
      await setupAuditSourceTestData(
        testData.dataCopyTestFileName,
        `${availableDate.prefix}/01`,
        true
      )
      testDataFileKey = `${availableDate.prefix}/01/${testData.dataCopyTestFileName}`

      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(3, availableDate.date)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    afterEach(async () => {
      // To stop long polling for database items corresponding to Glacier restores we're no longer interested in,
      // we delete the entry we created in this test
      await deleteDynamoDBTestItem(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        ticketId
      )
    })

    it('data all in glacier tier', async () => {
      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.glacierTierCopy,
            cloudwatchLogFilters.zendeskId,
            ticketId
          ],
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
      const auditFileRestoringStatusFound =
        await waitForAuditFileRestore(testDataFileKey)
      expect(auditFileRestoringStatusFound).toEqual(true)
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

    afterEach(async () => {
      // To stop long polling for database items corresponding to Glacier restores we're no longer interested in,
      // we delete the entry we created in this test
      await deleteDynamoDBTestItem(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        ticketId
      )
    })

    it('data in standard and glacier tier', async () => {
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
