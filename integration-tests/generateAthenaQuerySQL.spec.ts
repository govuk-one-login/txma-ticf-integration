import { approveZendeskRequest } from './utils/approveZendeskRequest'
import { createZendeskRequest } from './utils/raiseZendeskRequest'
import {
  populateDynamoDBWithRequestDetails,
  getValueFromDynamoDB
} from './utils/dynamoDB'
import { getEnvVariable } from './lib/zendeskParameters'
import { addMessageToQueue } from './utils/sqs'
import { pause } from './utils/pause'
import {
  waitForLogStreamContainingEvent,
  extractRequestIDFromEventMessage,
  getMatchingLogEvents
} from './utils/cloudwatchUtils'

describe('Athena Query SQL generation', () => {
  jest.setTimeout(120000)

  //TODO: add test for request without data paths when TT2-76 has been implemented
  it('Event successfully received in Audit Queue should trigger Athena SQL lambda', async () => {
    //TODO: Add setup and teardown from main
    const ticketID = await createZendeskRequest(true)
    await approveZendeskRequest(ticketID)

    await populateDynamoDBWithRequestDetails(ticketID)

    // NOTE: extra wait needed as lambda seems to be querying dynamodb too quickly
    await pause(20000)
    await addMessageToQueue(
      `${ticketID}`,
      getEnvVariable('INITIATE_ATHENA_QUERY_QUEUE_URL')
    )

    const eventProcessingMessage = 'Handling Athena Query event'
    const generatingAthenaSQLMessage = 'INFO Generating Athena SQL query string'
    const athenaSQLGeneratedMessage = 'INFO Athena SQL generated'
    const athenaQueryInitiatedMessage =
      'INFO Athena query execution initiated with QueryExecutionId'

    const eventLogStream = await waitForLogStreamContainingEvent(
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
      eventProcessingMessage,
      `"body`,
      `"${ticketID}`
    )
    const logStreamRequestID = extractRequestIDFromEventMessage(
      eventLogStream.eventMessage
    )

    const sqlGenerationFilterPattern = `"${logStreamRequestID}" ${generatingAthenaSQLMessage}`
    const sqlGenerationEvents = await getMatchingLogEvents(
      sqlGenerationFilterPattern,
      eventLogStream.logStreamName,
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME')
    )
    expect(sqlGenerationEvents.length).toEqual(1)

    const sqlGeneratedFilterPattern = `"${logStreamRequestID}" ${athenaSQLGeneratedMessage}`
    console.log(`SQL GENERATION FILTER PATTERN: ${sqlGeneratedFilterPattern}`)
    const sqlGeneratedEvents = await getMatchingLogEvents(
      sqlGenerationFilterPattern,
      eventLogStream.logStreamName,
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME')
    )
    expect(sqlGeneratedEvents.length).toEqual(1)

    const athenaQueryExecutionFilterPattern = `"${logStreamRequestID}" ${athenaQueryInitiatedMessage}`
    const athenaQueryInitiatedEvents = await getMatchingLogEvents(
      athenaQueryExecutionFilterPattern,
      eventLogStream.logStreamName,
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME')
    )
    expect(athenaQueryInitiatedEvents.length).toEqual(1)

    //Athena query id should be be put in dynamodb
    const value = await getValueFromDynamoDB(ticketID, 'athenaQueryId')
    expect(value!.athenaQueryId.S).toBeDefined()
  })

  /*it('Athena SQL Lambda should error if ticket details are not in Dynamodb', () => {
    expect(1).toEqual(1)
  })*/
})
