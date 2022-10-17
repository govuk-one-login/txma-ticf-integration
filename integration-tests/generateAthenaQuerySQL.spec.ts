import { approveZendeskRequest } from './utils/approveZendeskRequest'
import { createZendeskRequest } from './utils/raiseZendeskRequest'
import {
  populateTableWithRequestDetails,
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
  jest.setTimeout(180000)

  it('Retrieval Completion message in Audit Queue should trigger Athena SQL lambda', async () => {
    // SETUP:
    //1.) create and approve zendesk ticket
    const ticketID = await createZendeskRequest(true)
    await approveZendeskRequest(ticketID)

    //2.) Put Zendesk details in Dynamodb
    await populateTableWithRequestDetails(ticketID)

    // ACT:
    // Put message in queue
    await pause(30000) // lambda seems to be querying dynamodb too quickly
    await addMessageToQueue(
      `${ticketID}`,
      getEnvVariable('INITIATE_ATHENA_QUERY_QUEUE_URL')
    )

    // USE LOG REFERENCE: https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fticf-integration-initiate-athena-query/log-events/2022$252F10$252F17$252F$255B$2524LATEST$255D2158bbde3eff49eb9183249961dfd85a$3Fstart$3DPT3H
    // Validate event is processed by queue
    const eventProcessingMessage = 'Handling Athena Query event'
    const eventLogStream = await waitForLogStreamContainingEvent(
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME'),
      eventProcessingMessage,
      `"body`,
      `"${ticketID}`
    )
    const logStreamRequestID = extractRequestIDFromEventMessage(
      eventLogStream.eventMessage
    )

    // ASSERT:
    // Validate that SQL is generated

    // filter for SQL generation message
    const sqlGenerationFilterPattern = `"${logStreamRequestID}" INFO Generating Athena SQL query string`
    console.log(`SQL GENERATION FILTER PATTERN: ${sqlGenerationFilterPattern}`)
    const sqlGenerationEvents = await getMatchingLogEvents(
      sqlGenerationFilterPattern,
      eventLogStream.logStreamName,
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME')
    )

    expect(sqlGenerationEvents.length).toEqual(1)
    console.log(`SQL GENERATION EVENT: ${sqlGenerationEvents[0].message}`)

    const sqlGeneratedFilterPattern = `"${logStreamRequestID}" INFO Athena SQL generated:`
    console.log(`SQL GENERATION FILTER PATTERN: ${sqlGeneratedFilterPattern}`)
    const sqlGeneratedEvents = await getMatchingLogEvents(
      sqlGenerationFilterPattern,
      eventLogStream.logStreamName,
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME')
    )
    expect(sqlGeneratedEvents.length).toEqual(1)

    //TT2-18
    const athenaQueryExecutionFilterPattern = `"${logStreamRequestID}" INFO Athena query execution initiated with QueryExecutionId`
    const athenaQueryInitiatedEvents = await getMatchingLogEvents(
      athenaQueryExecutionFilterPattern,
      eventLogStream.logStreamName,
      getEnvVariable('INITIATE_ATHENA_QUERY_LAMBDA_LOG_GROUP_NAME')
    )
    expect(athenaQueryInitiatedEvents.length).toEqual(1)

    //Validate athenaQueryId is put in the table
    const value = await getValueFromDynamoDB(ticketID, 'athenaQueryId')

    expect(value!.athenaQueryId.S).toBeDefined()
  })

  /*it('Valid SQL should be created if ticket has custom data paths', () => {
    expect(1).toEqual(1)
  })*/

  /*it('Athena SQL Lambda should error if ticket details are not in Dynamodb', () => {
    expect(1).toEqual(1)
  })*/

  /*it('Athena SQL Lambda should error if ticket details does not contain dataPaths', () => {SEE ERRORS IN LOG: https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fticf-integration-initiate-athena-query/log-events/2022$252F10$252F17$252F$255B$2524LATEST$255Dca94587eed9f4b41917938fc1e132095$3Fstart$3DPT3H})*/
})
