import {
  eventIsPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { testData } from '../constants/testData'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../utils/getWebhookRequestDataForTestCaseNumberAndDate'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'

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
      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.nothingToCopyMessage,
            cloudwatchLogFilters.zendeskId,
            ticketId
          ],
          50
        )
      expect(processDataRequestEvents).not.toEqual([])
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
      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.nothingToCopyMessage,
            cloudwatchLogFilters.zendeskId,
            ticketId
          ],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])
      const isDataAvailableMessageInLogs = eventIsPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.allDataAvailableQueuingAthenaQuery
      )
      expect({
        result: isDataAvailableMessageInLogs,
        events: processDataRequestEvents
      }).toEqual({ result: true, events: processDataRequestEvents })
    })
  })
})
