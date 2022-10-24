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
import { validRequestData } from './constants/requestData'
import {
  ANALYSIS_BUCKET_NAME,
  ATHENA_QUERY_TEST_FILE_NAME,
  INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
  INITIATE_ATHENA_QUERY_QUEUE_URL
} from './constants/awsParameters'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import { generateRandomNumber } from './utils/helpers'
import { copyAuditDataFromTestDataBucket } from './utils/aws/s3CopyAuditDataFromTestDataBucket'

// TODO: ADD TO SET UP: - COPY DATA FROM TEST BUCKET TO ANALYSIS BUCKET, ENSURING DATE AND CONTENT MATCH ZENDESK TICKET DATE
// TODO: add test for request without data paths when TT2-76 has been implemented

describe('Athena Query SQL generation and execution', () => {
  jest.setTimeout(90000)

  describe('Query SQL generation and execution successful', () => {
    const randomTicketId = (Number(generateRandomNumber()) * 1000).toString()
    beforeAll(async () => {
      await populateDynamoDBWithTestItemDetails(randomTicketId)
      //TODO: CONTINUE MONDAY
      copyAuditDataFromTestDataBucket(
        ANALYSIS_BUCKET_NAME,
        'PATH_TO_NEW_FILE_THAT_I_WILL_PUT_INTO_THE_TEST_BUCKET',
        ATHENA_QUERY_TEST_FILE_NAME
      )
    })

    afterAll(async () => {
      await deleteDynamoDBTestItem(randomTicketId)
    })

    it('Event successfully received in Audit Queue should trigger Athena SQL lambda', async () => {
      console.log('Test ticket id: ' + randomTicketId)
      await addMessageToQueue(randomTicketId, INITIATE_ATHENA_QUERY_QUEUE_URL)

      const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
      const GENERATING_ATHENA_SQL_MESSAGE = 'Generating Athena SQL query string'
      const ATHENA_SQL_GENERATED_MESSAGE = 'Athena SQL generated'
      const ATHENA_INITIATED_QUERY_MESSAGE =
        'Athena query execution initiated with QueryExecutionId'

      const athenaQueryEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
          [ATHENA_EVENT_HANDLER_MESSAGE, 'body', randomTicketId]
        )

      expect(athenaQueryEvents).not.toEqual([])
      expect(athenaQueryEvents.length).toBeGreaterThan(1)
      assertEventPresent(athenaQueryEvents, GENERATING_ATHENA_SQL_MESSAGE)
      assertEventPresent(athenaQueryEvents, ATHENA_SQL_GENERATED_MESSAGE)
      assertEventPresent(athenaQueryEvents, ATHENA_INITIATED_QUERY_MESSAGE)

      //Athena query id should now be in dynamodb
      const value = await getValueFromDynamoDB(randomTicketId, 'athenaQueryId')
      expect(value?.athenaQueryId.S).toBeDefined()
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
      await addMessageToQueue(`${ticketId}`, INITIATE_ATHENA_QUERY_QUEUE_URL)

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
