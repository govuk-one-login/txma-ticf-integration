import {
  populateDynamoDBWithTestItemDetails as populateDynamoDBWithTicketDetails,
  getValueFromDynamoDB,
  deleteDynamoDBTestItem
} from '../../shared-test-code/utils/aws/dynamoDB'
import { addMessageToQueue } from '../../shared-test-code/utils/aws/sqs'
import {
  eventIsPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { downloadResultsFileAndParseData } from '../../shared-test-code/utils/queryResults/downloadAndParseResults'
import { pollNotifyMockForDownloadUrl } from '../../shared-test-code/utils/queryResults/getDownloadUrlFromNotifyMock'
import {
  generateRandomNumberString,
  getEnv
} from '../../shared-test-code/utils/helpers'
import { testData } from '../constants/testData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { generateZendeskTicketData } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'

const ticketWithDataPathAndPiiTypes = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: testData.athenaTestEventId1,
  datesList: '2022-04-01',
  piiTypes: ['addresses'],
  customDataPath:
    'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
})

const ticketWithPiiTypesOnly = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: testData.athenaTestEventId1,
  datesList: '2022-04-01',
  piiTypes: ['addresses', 'name']
})

const ticketWithCustomDataPathsOnly = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: testData.athenaTestEventId1,
  datesList: '2022-04-01',
  customDataPath:
    'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
})

const ticketWithMultipleDates = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: `${testData.athenaTestEventId1} ${testData.athenaTestEventId2}`,
  datesList: '2022-04-01 2022-05-01',
  customDataPath:
    'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
})

const maxRandomTicketId = 1000000000000

describe('Athena Query SQL generation and execution', () => {
  describe('Query SQL generation and execution successful', () => {
    let randomTicketId: string

    beforeEach(async () => {
      await copyAuditDataFromTestDataBucket(
        getEnv('ANALYSIS_BUCKET_NAME'),
        `firehose/${testData.athenaTestPrefix}/01/${testData.athenaTestFileName}`,
        testData.athenaTestFileName
      )
      await copyAuditDataFromTestDataBucket(
        getEnv('ANALYSIS_BUCKET_NAME'),
        `firehose/${testData.athenaTest2Prefix}/01/${testData.athenaTest2FileName}`,
        testData.athenaTest2FileName
      )
    })

    afterEach(async () => {
      await deleteDynamoDBTestItem(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId
      )
    })

    it('Successful Athena processing - requests having only data paths', async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithDataPathAndPiiTypes
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.athenaEventReceived, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)

      const isSqlGeneratedMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      const isQueryInitiatedMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )
      expect({
        result: isSqlGeneratedMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })
      expect({
        result: isQueryInitiatedMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const downloadUrl = await pollNotifyMockForDownloadUrl(randomTicketId)
      expect(downloadUrl.startsWith('https')).toBe(true)
      const csvRows = await downloadResultsFileAndParseData(downloadUrl)

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].birthdate0_value).toEqual(testData.athenaTestBirthDate)
      expect(csvRows[0].address0_buildingname).toEqual(
        testData.athenaTestBuildingName
      )
    })

    it('Successful Athena processing - requests having only PII type', async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithPiiTypesOnly
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.athenaEventReceived, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)

      const isAthenaSqlGeneratedMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      expect({
        result: isAthenaSqlGeneratedMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const isAthenaInitiatedQueryMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )
      expect({
        result: isAthenaInitiatedQueryMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const downloadUrl = await pollNotifyMockForDownloadUrl(randomTicketId)
      expect(downloadUrl.startsWith('https')).toBe(true)
      const csvRows = await downloadResultsFileAndParseData(downloadUrl)

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].name).toEqual(testData.athenaTestName)
      expect(csvRows[0].addresses).toEqual(testData.athenaTestAddresses)
    })

    it('Successful Athena processing - requests having both data paths and PII types', async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithCustomDataPathsOnly
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.athenaEventReceived, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)

      const isAthenaSqlGeneratedMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      expect({
        result: isAthenaSqlGeneratedMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const isAthenaInitiatedQueryMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )
      expect({
        result: isAthenaInitiatedQueryMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const downloadUrl = await pollNotifyMockForDownloadUrl(randomTicketId)
      expect(downloadUrl.startsWith('https')).toBe(true)
      const csvRows = await downloadResultsFileAndParseData(downloadUrl)

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].birthdate0_value).toEqual(testData.athenaTestBirthDate)
      expect(csvRows[0].address0_buildingname).toEqual(
        testData.athenaTestBuildingName
      )
      expect(csvRows[0].name).toEqual(testData.athenaTestName)
      expect(csvRows[0].addresses).toEqual(testData.athenaTestAddresses)
    })

    it('Successful Athena processing - requests having multiples dates', async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithMultipleDates
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.athenaEventReceived, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)

      const isAthenaSqlGeneratedMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      expect({
        result: isAthenaSqlGeneratedMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const isAthenaInitiatedQueryMessageInLogs = eventIsPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )
      expect({
        result: isAthenaInitiatedQueryMessageInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const downloadUrl = await pollNotifyMockForDownloadUrl(randomTicketId)
      expect(downloadUrl.startsWith('https')).toBe(true)
      const csvRows = await downloadResultsFileAndParseData(downloadUrl)

      expect(csvRows.length).toEqual(2)
      const event1Data = csvRows.find(
        (row) => row.event_id === testData.athenaTestEventId1
      )
      const event2Data = csvRows.find(
        (row) => row.event_id === testData.athenaTestEventId2
      )
      if (!event1Data || !event2Data) {
        throw new Error(
          'Could not find data for one or more of the test events'
        )
      }
      expect(event1Data.birthdate0_value).toEqual(testData.athenaTestBirthDate)
      expect(event1Data.address0_buildingname).toEqual(
        testData.athenaTestBuildingName
      )
      expect(event1Data.name).toEqual(testData.athenaTestName)
      expect(event1Data.addresses).toEqual(testData.athenaTestAddresses)

      expect(event2Data.birthdate0_value).toEqual(testData.athenaTestBirthDate2)
      expect(event2Data.address0_buildingname).toEqual(
        testData.athenaTestBuildingName2
      )
      expect(event2Data.name).toEqual(testData.athenaTestName2)
      expect(event2Data.addresses).toEqual(testData.athenaTestAddresses2)
    })
  })

  describe('Query execution unsuccessful', () => {
    let randomTicketId: string

    it('Lambda should error if ticket details are not in Dynamodb', async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)

      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.athenaEventReceived, 'body', randomTicketId]
        )
      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)

      const isAthenaHandlerInvokeErrorInLogs = eventIsPresent(
        athenaQueryEvents,
        `${cloudwatchLogFilters.athenaInvokeError} '${randomTicketId}'`
      )
      expect({
        result: isAthenaHandlerInvokeErrorInLogs,
        events: athenaQueryEvents
      }).toEqual({ result: true, events: athenaQueryEvents })
    })
  })
})
