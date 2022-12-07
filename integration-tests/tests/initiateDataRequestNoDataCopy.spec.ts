import {
  ANALYSIS_BUCKET_NAME,
  AUDIT_BUCKET_NAME,
  DATA_SENT_TO_QUEUE_MESSAGE,
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
  SQS_EVENT_RECEIVED_MESSAGE,
  TEST_FILE_NAME,
  WEBHOOK_RECEIVED_MESSAGE
} from './constants/awsParameters'
import {
  setCustomFieldValueForRequest,
  validRequestData
} from './constants/requestData/dataCopyRequestData'
import { ZendeskFormFieldIDs } from './constants/zendeskParameters'
import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern,
  getQueueMessageId
} from './utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import { getAvailableTestDate } from './utils/aws/s3GetAvailableTestDate'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'

const NOTHING_TO_COPY_MESSAGE =
  'Number of standard tier files to copy was 0, glacier tier files to copy was 0'
const DATA_AVAILABLE_MESSAGE = 'All data available, queuing Athena query'

describe('Data should not be copied to analysis bucket', () => {
  const generateTestDataWithCustomDate = (date: string) => {
    const data = validRequestData

    setCustomFieldValueForRequest(
      data,
      ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
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
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      assertEventPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)

      const messageId = getQueueMessageId(initiateDataRequestEvents)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
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
        AUDIT_BUCKET_NAME,
        `${availableDate.prefix}}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
        'STANDARD',
        true
      )
      await copyAuditDataFromTestDataBucket(
        ANALYSIS_BUCKET_NAME,
        `${availableDate.prefix}}/01/${TEST_FILE_NAME}`,
        TEST_FILE_NAME,
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
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )
      expect(initiateDataRequestEvents).not.toEqual([])

      assertEventPresent(initiateDataRequestEvents, DATA_SENT_TO_QUEUE_MESSAGE)

      const messageId = getQueueMessageId(initiateDataRequestEvents)
      console.log('messageId', messageId)

      const processDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          PROCESS_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [SQS_EVENT_RECEIVED_MESSAGE, 'messageId', messageId],
          70
        )
      expect(processDataRequestEvents).not.toEqual([])

      assertEventPresent(processDataRequestEvents, NOTHING_TO_COPY_MESSAGE)
      assertEventPresent(processDataRequestEvents, DATA_AVAILABLE_MESSAGE)
    })
  })
})
