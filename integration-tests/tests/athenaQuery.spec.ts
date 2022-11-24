import {
  populateDynamoDBWithTestItemDetails,
  getValueFromDynamoDB,
  deleteDynamoDBTestItem
} from './utils/aws/dynamoDB'
import { addMessageToQueue } from './utils/aws/sqs'
import {
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from './utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { validRequestData } from './constants/requestData/dataCopyRequestData'
import {
  ANALYSIS_BUCKET_NAME,
  ATHENA_QUERY_DATA_TEST_DATE_PREFIX,
  ATHENA_QUERY_TEST_FILE_NAME,
  INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP
} from './constants/awsParameters'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'
import {
  dynamoDBItemDataPathAndPIITypes,
  dynamoDBItemDataPathsOnly,
  dynamoDBItemPIITypesOnly
} from './constants/dynamoDBItemDetails'
import { deleteAuditDataWithPrefix } from './utils/aws/s3DeleteAuditDataWithPrefix'
import { downloadResultsFileAndParseData } from './utils/queryResults/downloadAndParseResults'
import { getEnv } from './utils/helpers'

describe('Athena Query SQL generation and execution', () => {
  jest.setTimeout(90000)

  describe('Query SQL generation and execution successful', () => {
    let randomTicketId: string
    beforeEach(async () => {
      randomTicketId = Date.now().toString()
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${ATHENA_QUERY_DATA_TEST_DATE_PREFIX}`
      )
      await copyAuditDataFromTestDataBucket(
        ANALYSIS_BUCKET_NAME,
        `firehose/${ATHENA_QUERY_DATA_TEST_DATE_PREFIX}/01/${ATHENA_QUERY_TEST_FILE_NAME}`,
        ATHENA_QUERY_TEST_FILE_NAME
      )
    })

    afterEach(async () => {
      await deleteDynamoDBTestItem(randomTicketId)
      await deleteAuditDataWithPrefix(
        ANALYSIS_BUCKET_NAME,
        `firehose/${ATHENA_QUERY_DATA_TEST_DATE_PREFIX}`
      )
    })

    it('Successful Athena processing - requests having only data paths', async () => {
      console.log('Test ticket id: ' + randomTicketId)
      await populateDynamoDBWithTestItemDetails(
        randomTicketId,
        dynamoDBItemDataPathsOnly
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
      const ATHENA_SQL_GENERATED_MESSAGE = 'Athena SQL generated'
      const ATHENA_INITIATED_QUERY_MESSAGE =
        'Athena query execution initiated with QueryExecutionId'
      const EXPECTED_RESULTS_BIRTHDATE = `"1981-07-28"`
      const EXPECTED_BUILDING_NAME = `"PERIGARTH"`

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
          [ATHENA_EVENT_HANDLER_MESSAGE, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)

      assertEventPresent(athenaQueryEvents, ATHENA_SQL_GENERATED_MESSAGE)
      assertEventPresent(athenaQueryEvents, ATHENA_INITIATED_QUERY_MESSAGE)

      const value = await getValueFromDynamoDB(randomTicketId, 'athenaQueryId')
      expect(value?.athenaQueryId.S).toBeDefined()

      const csvRows = await downloadResultsFileAndParseData(randomTicketId)

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].birthdate0_value).toEqual(EXPECTED_RESULTS_BIRTHDATE)
      expect(csvRows[0].address0_buildingname).toEqual(EXPECTED_BUILDING_NAME)
    })

    it('Successful Athena processing - requests having only PII type', async () => {
      console.log('Test ticket id: ' + randomTicketId)
      await populateDynamoDBWithTestItemDetails(
        randomTicketId,
        dynamoDBItemPIITypesOnly
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
      const ATHENA_SQL_GENERATED_MESSAGE = 'Athena SQL generated'
      const ATHENA_INITIATED_QUERY_MESSAGE =
        'Athena query execution initiated with QueryExecutionId'
      const EXPECTED_NAME = `[{"nameparts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`
      const EXPECTED_ADDRESSES = `[{"uprn":"9051041658","buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB","validfrom":"2014-01-01"},{"buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB"}]`

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
          [ATHENA_EVENT_HANDLER_MESSAGE, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)
      assertEventPresent(athenaQueryEvents, ATHENA_SQL_GENERATED_MESSAGE)
      assertEventPresent(athenaQueryEvents, ATHENA_INITIATED_QUERY_MESSAGE)

      const value = await getValueFromDynamoDB(randomTicketId, 'athenaQueryId')
      expect(value?.athenaQueryId.S).toBeDefined()

      const csvRows = await downloadResultsFileAndParseData(randomTicketId)

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].name).toEqual(EXPECTED_NAME)
      expect(csvRows[0].addresses).toEqual(EXPECTED_ADDRESSES)
    })

    it('Successful Athena processing - requests having both data paths and PII types', async () => {
      console.log('Test ticket id: ' + randomTicketId)
      await populateDynamoDBWithTestItemDetails(
        randomTicketId,
        dynamoDBItemDataPathAndPIITypes
      )
      await addMessageToQueue(
        randomTicketId,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
      const ATHENA_SQL_GENERATED_MESSAGE = 'Athena SQL generated'
      const ATHENA_INITIATED_QUERY_MESSAGE =
        'Athena query execution initiated with QueryExecutionId'
      const EXPECTED_ADDRESSES = `[{"uprn":"9051041658","buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB","validfrom":"2014-01-01"},{"buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB"}]`
      const EXPECTED_NAME = `[{"nameparts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`
      const EXPECTED_BUILDING_NAME = `"PERIGARTH"`
      const EXPECTED_RESULTS_BIRTHDATE = `"1981-07-28"`

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
          [ATHENA_EVENT_HANDLER_MESSAGE, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)
      assertEventPresent(athenaQueryEvents, ATHENA_SQL_GENERATED_MESSAGE)
      assertEventPresent(athenaQueryEvents, ATHENA_INITIATED_QUERY_MESSAGE)

      const value = await getValueFromDynamoDB(randomTicketId, 'athenaQueryId')
      expect(value?.athenaQueryId.S).toBeDefined()

      const csvRows = await downloadResultsFileAndParseData(randomTicketId)

      expect(csvRows.length).toEqual(1)
      expect(csvRows[0].birthdate0_value).toEqual(EXPECTED_RESULTS_BIRTHDATE)
      expect(csvRows[0].address0_buildingname).toEqual(EXPECTED_BUILDING_NAME)
      expect(csvRows[0].name).toEqual(EXPECTED_NAME)
      expect(csvRows[0].addresses).toEqual(EXPECTED_ADDRESSES)
    })
  })

  describe('Query execution unsuccessful', () => {
    let ticketId: string

    beforeAll(async () => {
      ticketId = await createZendeskTicket(validRequestData)
    })

    afterAll(async () => {
      await deleteZendeskTicket(ticketId)
    })

    it('Lambda should error if ticket details are not in Dynamodb', async () => {
      await addMessageToQueue(
        `${ticketId}`,
        getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
      )

      const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
      const ATHENA_HANDLER_INVOKE_ERROR =
        'Cannot find database entry for zendesk ticket'
      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
          [
            ATHENA_EVENT_HANDLER_MESSAGE,
            'body',
            ticketId,
            `ApproximateReceiveCount\\":`,
            `\\"2\\"`
          ]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)
      assertEventPresent(athenaQueryEvents, ATHENA_HANDLER_INVOKE_ERROR)
    })
  })
})
