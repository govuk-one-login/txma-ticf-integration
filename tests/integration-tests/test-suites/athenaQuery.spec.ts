import {
  populateDynamoDBWithTestItemDetails as populateDynamoDBWithTicketDetails,
  getValueFromDynamoDB,
  deleteDynamoDBTestItem
} from '../../shared-test-code/utils/aws/dynamoDB'
import { addMessageToQueue } from '../../shared-test-code/utils/aws/sqs'
import {
  waitForEventWithPatterns,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import {
  generateRandomNumberString,
  getEnv
} from '../../shared-test-code/utils/helpers'
import { testData } from '../constants/testData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { generateZendeskTicketData } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import * as CSV from 'csv-string'
import { s3WaitForFileContents } from '../../shared-test-code/utils/aws/s3WaitForFileContents'

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

const normalizeAddressesJson = (addressesString: string): string => {
  return JSON.stringify(
    JSON.parse(addressesString).map((item: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, String(value)])
      )
    )
  )
}

const waitForAthenaQueryOutputFile = async (
  athenaQueryId: string
): Promise<Record<string, string>[]> => {
  const csvData = await s3WaitForFileContents(
    getEnv('ATHENA_OUTPUT_BUCKET_NAME'),
    `ticf-automated-audit-data-queries/${athenaQueryId}.csv`
  )
  const csvRows = CSV.parse(csvData as string, { output: 'objects' })
  // Ensure all values are strings to maintain backward compatibility
  return csvRows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, String(value)])
    )
  )
}

describe('Athena Query SQL generation and execution', () => {
  describe('Query SQL generation and execution successful', () => {
    let randomTicketId: string

    beforeEach(async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)

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
      console.log(
        `Test: Successful Athena processing - requests having only data paths. ticketId: ${randomTicketId}`
      )
      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithDataPathAndPiiTypes
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryInitiatedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.athenaQueryInitiated,
            cloudwatchLogFilters.zendeskId,
            randomTicketId
          ]
        )

      expect(athenaQueryInitiatedEvents).not.toEqual([])
      expect(athenaQueryInitiatedEvents.length).toBeGreaterThan(1)

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      const athenaQueryId = value?.athenaQueryId
      expect(athenaQueryId).toBeDefined()

      const csvRows = await waitForAthenaQueryOutputFile(athenaQueryId)

      expect(csvRows).toHaveLength(1)
      expect(csvRows[0].birthDate0_value).toEqual(testData.athenaTestBirthDate)
      expect(csvRows[0].address0_buildingName).toEqual(
        testData.athenaTestBuildingName
      )
    })

    it('Successful Athena processing - requests having only PII type', async () => {
      console.log(
        `Test: Successful Athena processing - requests having only PII type. ticketId: ${randomTicketId}`
      )

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithPiiTypesOnly
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryInitiatedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.athenaQueryInitiated,
            cloudwatchLogFilters.zendeskId,
            randomTicketId
          ]
        )

      expect(athenaQueryInitiatedEvents).not.toEqual([])
      expect(athenaQueryInitiatedEvents.length).toBeGreaterThan(1)

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      const athenaQueryId = value?.athenaQueryId
      expect(athenaQueryId).toBeDefined()

      const csvRows = await waitForAthenaQueryOutputFile(athenaQueryId)

      expect(csvRows).toHaveLength(1)
      expect(csvRows[0].name).toEqual(testData.athenaTestName)

      expect(normalizeAddressesJson(csvRows[0].addresses)).toEqual(
        testData.athenaTestAddresses
      )
    })

    it('Successful Athena processing - requests having both data paths and PII types', async () => {
      console.log(
        `Test:Successful Athena processing - requests having both data paths and PII types. ticketId: ${randomTicketId}`
      )

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithCustomDataPathsOnly
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryInitiatedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.athenaQueryInitiated,
            cloudwatchLogFilters.zendeskId,
            randomTicketId
          ]
        )

      expect(athenaQueryInitiatedEvents).not.toEqual([])
      expect(athenaQueryInitiatedEvents.length).toBeGreaterThan(1)

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      const athenaQueryId = value?.athenaQueryId
      expect(athenaQueryId).toBeDefined()

      const csvRows = await waitForAthenaQueryOutputFile(athenaQueryId)

      expect(csvRows).toHaveLength(1)
      expect(csvRows[0].birthDate0_value).toEqual(testData.athenaTestBirthDate)
      expect(csvRows[0].address0_buildingName).toEqual(
        testData.athenaTestBuildingName
      )
      expect(csvRows[0].name).toEqual(testData.athenaTestName)

      expect(normalizeAddressesJson(csvRows[0].addresses)).toEqual(
        testData.athenaTestAddresses
      )
    })

    it('Successful Athena processing - requests having multiples dates', async () => {
      console.log(
        `Test: Successful Athena processing - requests having multiples dates. ticketId: ${randomTicketId}`
      )

      await populateDynamoDBWithTicketDetails(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        ticketWithMultipleDates
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryInitiatedEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.athenaQueryInitiated,
            cloudwatchLogFilters.zendeskId,
            randomTicketId
          ]
        )

      expect(athenaQueryInitiatedEvents).not.toEqual([])
      expect(athenaQueryInitiatedEvents.length).toBeGreaterThan(1)

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )

      const athenaQueryId = value?.athenaQueryId
      expect(athenaQueryId).toBeDefined()

      const csvRows = await waitForAthenaQueryOutputFile(athenaQueryId)

      expect(csvRows).toHaveLength(2)
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
      expect(event1Data.birthDate0_value).toEqual(testData.athenaTestBirthDate)
      expect(event1Data.address0_buildingName).toEqual(
        testData.athenaTestBuildingName
      )
      expect(event1Data.name).toEqual(testData.athenaTestName)

      expect(normalizeAddressesJson(event1Data.addresses)).toEqual(
        testData.athenaTestAddresses
      )

      expect(event2Data.birthDate0_value).toEqual(testData.athenaTestBirthDate2)
      expect(event2Data.address0_buildingName).toEqual(
        testData.athenaTestBuildingName2
      )
      expect(event2Data.name).toEqual(testData.athenaTestName2)

      expect(normalizeAddressesJson(event2Data.addresses)).toEqual(
        testData.athenaTestAddresses2
      )
    })
  })

  describe('Query execution unsuccessful', () => {
    let randomTicketId: string

    beforeEach(async () => {
      randomTicketId = generateRandomNumberString(maxRandomTicketId)
    })

    it('Lambda should error if ticket details are not in Dynamodb', async () => {
      console.log(
        `Test: Lambda should error if ticket details are not in Dynamodb. ticketId: ${randomTicketId}`
      )

      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryInvokeErrorEvents = await waitForEventWithPatterns(
        getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
        [`Cannot find database entry for zendesk ticket '${randomTicketId}'`],
        10
      )
      expect(athenaQueryInvokeErrorEvents).not.toEqual([])
    })
  })
})
