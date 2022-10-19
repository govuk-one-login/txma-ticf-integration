import {
  populateDynamoDBWithRequestDetails,
  getValueFromDynamoDB
} from './utils/aws/dynamoDB'
import { addMessageToQueue } from './utils/aws/sqs'
import {
  getCloudWatchLogEventsGroupByMessagePattern,
  isLogPresent
} from './utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { validRequestData } from './constants/requestData'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import {
  INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
  INITIATE_ATHENA_QUERY_QUEUE_URL
} from './constants/awsParameters'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'

describe('Athena Query SQL generation and execution', () => {
  jest.setTimeout(60000)
  let ticketId: string

  beforeEach(async () => {
    ticketId = await createZendeskTicket(validRequestData)
    await approveZendeskTicket(ticketId)
  })

  afterEach(async () => {
    await deleteZendeskTicket(ticketId)
  })

  //TODO: add test for request without data paths when TT2-76 has been implemented

  it('Event successfully received in Audit Queue should trigger Athena SQL lambda', async () => {
    await populateDynamoDBWithRequestDetails(ticketId)
    await addMessageToQueue(`${ticketId}`, INITIATE_ATHENA_QUERY_QUEUE_URL)

    const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
    const GENERATING_ATHENA_SQL_MESSAGE = 'Generating Athena SQL query string'
    const ATHENA_SQL_GENERATED_MESSAGE = 'Athena SQL generated'
    const ATHENA_INITIATED_QUERY_MESSAGE =
      'Athena query execution initiated with QueryExecutionId'

    const athenaQueryEvents = await getCloudWatchLogEventsGroupByMessagePattern(
      INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
      [ATHENA_EVENT_HANDLER_MESSAGE, 'body', ticketId]
    )

    expect(athenaQueryEvents).not.toEqual([])
    expect(athenaQueryEvents.length).toBeGreaterThan(1)
    expect(isLogPresent(athenaQueryEvents, GENERATING_ATHENA_SQL_MESSAGE)).toBe(
      true
    )
    expect(isLogPresent(athenaQueryEvents, ATHENA_SQL_GENERATED_MESSAGE)).toBe(
      true
    )
    expect(
      isLogPresent(athenaQueryEvents, ATHENA_INITIATED_QUERY_MESSAGE)
    ).toBe(true)

    //Athena query id should now be in dynamodb
    const value = await getValueFromDynamoDB(ticketId, 'athenaQueryId')
    expect(value!.athenaQueryId.S).toBeDefined()
  })

  it('Lambda should error if ticket details are not in Dynamodb', async () => {
    await addMessageToQueue(`${ticketId}`, INITIATE_ATHENA_QUERY_QUEUE_URL)

    const ATHENA_EVENT_HANDLER_MESSAGE = 'Handling Athena Query event'
    const ATHENA_HANDLER_INVOKE_ERROR =
      'Cannot find database entry for zendesk ticket'
    const athenaQueryEvents = await getCloudWatchLogEventsGroupByMessagePattern(
      INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP,
      [
        ATHENA_EVENT_HANDLER_MESSAGE,
        'body',
        ticketId,
        'ApproximateReceiveCount',
        '2'
      ]
    )

    expect(athenaQueryEvents).not.toEqual([])
    expect(athenaQueryEvents.length).toBeGreaterThan(1)
    expect(isLogPresent(athenaQueryEvents, ATHENA_HANDLER_INVOKE_ERROR)).toBe(
      true
    )
  })
})
