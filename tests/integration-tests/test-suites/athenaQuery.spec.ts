import {
  populateDynamoDBWithTestItemDetails as populateDynamoDBWithTicketDetails,
  getValueFromDynamoDB,
  deleteDynamoDBTestItem
} from '../../shared-test-code/utils/aws/dynamoDB'
import { addMessageToQueue } from '../../shared-test-code/utils/aws/sqs'
import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from '../../shared-test-code/utils/zendesk/createZendeskTicket'
import { deleteZendeskTicket } from '../../shared-test-code/utils/zendesk/deleteZendeskTicket'
import { copyAuditDataFromTestDataBucket } from '../../shared-test-code/utils/aws/s3CopyAuditDataFromTestDataBucket'
import { downloadResultsFileAndParseData } from '../../shared-test-code/utils/queryResults/downloadAndParseResults'
import { getEnv } from '../../shared-test-code/utils/helpers'
import { integrationTestData } from '../constants/testData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { generateZendeskTicketData } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { requestConstants } from '../constants/requests'

const ticketWithDataPathAndPiiTypes = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: '99cbfa88-5277-422f-af25-be0864adb7db',
  requestDate: '2022-04-01',
  piiTypes: ['addresses'],
  customDataPath:
    'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
})

const ticketWithPiiTypesOnly = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: '99cbfa88-5277-422f-af25-be0864adb7db',
  requestDate: '2022-04-01',
  piiTypes: ['addresses', 'name']
})

const ticketWithCustomDataPathsOnly = generateZendeskTicketData({
  identifier: 'event_id',
  eventIds: '99cbfa88-5277-422f-af25-be0864adb7db',
  requestDate: '2022-04-01',
  customDataPath:
    'restricted.name restricted.birthDate[0].value restricted.address[0].buildingName'
})

describe('Athena Query SQL generation and execution', () => {
  describe('Query SQL generation and execution successful', () => {
    let randomTicketId: string

    beforeEach(async () => {
      randomTicketId = Date.now().toString()
      await copyAuditDataFromTestDataBucket(
        getEnv('ANALYSIS_BUCKET_NAME'),
        `firehose/${integrationTestData.athenaTestPrefix}/01/${integrationTestData.athenaTestFileName}`,
        integrationTestData.athenaTestFileName
      )
    })

    afterEach(async () => {
      await deleteDynamoDBTestItem(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId
      )
    })

    it('Successful Athena processing - requests having only data paths', async () => {
      console.log('Test ticket id: ' + randomTicketId)
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

      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const csvRows = await downloadResultsFileAndParseData(randomTicketId)

      const expectedBirthDate = `"1981-07-28"`
      const expectedBuildingName = `"PERIGARTH"`

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].birthdate0_value).toEqual(expectedBirthDate)
      expect(csvRows[0].address0_buildingname).toEqual(expectedBuildingName)
    })

    it('Successful Athena processing - requests having only PII type', async () => {
      console.log('Test ticket id: ' + randomTicketId)
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
      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const csvRows = await downloadResultsFileAndParseData(randomTicketId)

      const expectedName = `[{"nameparts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`
      const expectedAddress = `[{"uprn":"9051041658","buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB","validfrom":"2014-01-01"},{"buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB"}]`

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].name).toEqual(expectedName)
      expect(csvRows[0].addresses).toEqual(expectedAddress)
    })

    it('Successful Athena processing - requests having both data paths and PII types', async () => {
      console.log('Test ticket id: ' + randomTicketId)
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
      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaSqlGenerated
      )
      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaQueryInitiated
      )

      const value = await getValueFromDynamoDB(
        getEnv('AUDIT_REQUEST_DYNAMODB_TABLE'),
        randomTicketId,
        'athenaQueryId'
      )
      expect(value?.athenaQueryId.S).toBeDefined()

      const csvRows = await downloadResultsFileAndParseData(randomTicketId)

      const expectedAddresses = `[{"uprn":"9051041658","buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB","validfrom":"2014-01-01"},{"buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB"}]`
      const expectedName = `[{"nameparts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`
      const expectedBuildingName = `"PERIGARTH"`
      const expectedBirthDate = `"1981-07-28"`

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].birthdate0_value).toEqual(expectedBirthDate)
      expect(csvRows[0].address0_buildingname).toEqual(expectedBuildingName)
      expect(csvRows[0].name).toEqual(expectedName)
      expect(csvRows[0].addresses).toEqual(expectedAddresses)
    })
  })

  describe('Query execution unsuccessful', () => {
    let ticketId: string

    beforeAll(async () => {
      ticketId = await createZendeskTicket(requestConstants.invalid)
    })

    afterAll(async () => {
      await deleteZendeskTicket(ticketId)
    })

    it('Lambda should error if ticket details are not in Dynamodb', async () => {
      await addMessageToQueue(
        `${ticketId}`,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
          [
            cloudwatchLogFilters.athenaEventReceived,
            'body',
            ticketId,
            `ApproximateReceiveCount\\":`,
            `\\"2\\"`
          ]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)
      assertEventPresent(
        athenaQueryEvents,
        cloudwatchLogFilters.athenaInvokeError
      )
    })
  })
})
