import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { testData } from '../constants/testData'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../../shared-test-code/utils/zendesk/getTicketDetailsForId'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'

const NOTHING_TO_COPY_MESSAGE =
  'Number of standard tier files to copy was 0, glacier tier files to copy was 0'
const DATA_AVAILABLE_MESSAGE = 'All data available, queuing Athena query'

describe('Data should not be copied to analysis bucket', () => {
  describe('valid requests for no data copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(5, '2022-01-07')
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('request for valid data, no files present', async () => {
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
        `${availableDate.prefix}/01/${testData.dataCopyTestFileName}`,
        testData.dataCopyTestFileName,
        'STANDARD',
        true
      )
      await copyAuditDataFromTestDataBucket(
        getEnv('ANALYSIS_BUCKET_NAME'),
        `${availableDate.prefix}/01/${testData.dataCopyTestFileName}`,
        testData.dataCopyTestFileName,
        'STANDARD',
        true
      )
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(1, availableDate.date)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('request for valid data already in analysis bucket', async () => {
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
