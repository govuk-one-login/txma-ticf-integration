import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { approveZendeskTicket } from '../../shared-test-code/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../../shared-test-code/utils/zendesk/createZendeskTicket'
import { deleteZendeskTicket } from '../../shared-test-code/utils/zendesk/deleteZendeskTicket'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { zendeskConstants } from '../../shared-test-code/constants/zendeskParameters'
import { setCustomFieldValueForRequest } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { integrationTestData } from '../constants/testData'
import { requestConstants } from '../constants/requests'

const NOTHING_TO_COPY_MESSAGE =
  'Number of standard tier files to copy was 0, glacier tier files to copy was 0'
const DATA_AVAILABLE_MESSAGE = 'All data available, queuing Athena query'

describe('Data should not be copied to analysis bucket', () => {
  const generateTestDataWithCustomDate = (date: string) => {
    const data = requestConstants.valid

    setCustomFieldValueForRequest(
      data,
      zendeskConstants.fieldIds.requestDate,
      date
    )
    return data
  }

  describe('valid requests for no data copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      ticketId = await createZendeskTicket(
        generateTestDataWithCustomDate(availableDate.date)
      )
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      console.log('request for valid data, no files present test ended')
    })

    test('request for valid data, no files present', async () => {
      console.log('request for valid data, no files present test started')
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )

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

      assertEventPresent(processDataRequestEvents, NOTHING_TO_COPY_MESSAGE)
    })
  })

  describe('valid requests - data present in analysis bucket', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${integrationTestData.dataCopyTestFileName}`,
        integrationTestData.dataCopyTestFileName,
        'STANDARD',
        true
      )
      await copyAuditDataFromTestDataBucket(
        getEnv('ANALYSIS_BUCKET_NAME'),
        `${availableDate.prefix}/01/${integrationTestData.dataCopyTestFileName}`,
        integrationTestData.dataCopyTestFileName,
        'STANDARD',
        true
      )
      ticketId = await createZendeskTicket(
        generateTestDataWithCustomDate(availableDate.date)
      )
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
      console.log(
        'request for valid data already in analysis bucket test ended'
      )
    })

    test('request for valid data already in analysis bucket', async () => {
      console.log(
        'request for valid data already in analysis bucket test started'
      )
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )

      const messageId = getQueueMessageId(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )
      console.log('messageId', messageId)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.sqsEventReceived, 'messageId', messageId],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(processDataRequestEvents, NOTHING_TO_COPY_MESSAGE)
      assertEventPresent(processDataRequestEvents, DATA_AVAILABLE_MESSAGE)
    })
  })
})
