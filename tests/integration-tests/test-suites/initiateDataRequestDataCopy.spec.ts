import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from '../../shared-test-code/utils/zendesk/createZendeskTicket'
import { approveZendeskTicket } from '../../shared-test-code/utils/zendesk/approveZendeskTicket'
import { deleteZendeskTicket } from '../../shared-test-code/utils/zendesk/deleteZendeskTicket'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from '../../shared-test-code/utils/aws/s3GetAvailableTestDate'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { zendeskConstants } from '../../shared-test-code/constants/zendeskParameters'
import { setCustomFieldValueForRequest } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { integrationTestData } from '../constants/testData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { requestConstants } from '../constants/requests'

describe('Data should be copied to analysis bucket', () => {
  const generateTestDataWithCustomDate = (date: string) => {
    const data = requestConstants.valid

    setCustomFieldValueForRequest(
      data,
      zendeskConstants.fieldIds.requestDate,
      date
    )
    return data
  }

  describe('valid requests for standard copy - analysis bucket empty', () => {
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
      ticketId = await createZendeskTicket(
        generateTestDataWithCustomDate(availableDate.date)
      )
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
      console.log('request for valid data all in standard tier test ended')
    })

    test('request for valid data all in standard tier', async () => {
      console.log('request for valid data all in standard tier test started')
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
          50
        )

      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.standardTierCopy
      )
      assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.copyStarted
      )

      const copyCompletedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.copyComplete, 'zendeskId', ticketId],
          100
        )
      expect(copyCompletedEvents).not.toEqual([])

      assertEventPresent(copyCompletedEvents, cloudwatchLogFilters.copyComplete)
    })
  })

  describe('valid requests for glacier copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${integrationTestData.dataCopyTestFileName}`,
        integrationTestData.dataCopyTestFileName,
        'GLACIER',
        true
      )
      ticketId = await createZendeskTicket(
        generateTestDataWithCustomDate(availableDate.date)
      )
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      console.log('request for valid data all in glacier tier test ended')
    })

    test('request for valid data all in glacier tier', async () => {
      console.log('request for valid data all in glacier tier test started')
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
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.glacierTierCopy
      )
      assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.restoreStarted
      )
    })
  })

  describe('valid requests for standard and glacier copy - analysis bucket empty', () => {
    let ticketId: string

    beforeEach(async () => {
      const availableDate = await getAvailableTestDate()

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/01/${integrationTestData.dataCopyTestFileName}`,
        integrationTestData.dataCopyTestFileName,
        'GLACIER',
        true
      )

      await copyAuditDataFromTestDataBucket(
        getEnv('AUDIT_BUCKET_NAME'),
        `${availableDate.prefix}/02/${integrationTestData.dataCopyTestFileName}`,
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
      console.log(
        'valid request with data in standard and glacier tier test ended'
      )
    })

    test('valid request with data in standard and glacier tier', async () => {
      console.log(
        'valid request with data in standard and glacier tier test started'
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
          50
        )
      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(
        processDataRequestEvents,
        cloudwatchLogFilters.mixedTierCopy
      )
    })
  })
})
