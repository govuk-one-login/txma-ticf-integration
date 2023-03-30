import { Context, SQSEvent } from 'aws-lambda'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { confirmAthenaTable } from './confirmAthenaTable'
import { createQuerySql } from './createQuerySql'
import { startQueryExecution } from './startQueryExecution'
import { updateQueryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { CreateQuerySqlResult } from '../../types/athena/createQuerySqlResult'
import { StartQueryExecutionResult } from '../../types/athena/startQueryExecutionResult'
import { ConfirmAthenaTableResult } from '../../types/athena/confirmAthenaTableResult'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../sharedServices/logger'
import { publishToSNS } from '../../sharedServices/sns/publishToSNS'
import { getEnv } from '../../utils/helpers'

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  initialiseLogger(context)

  const zendeskId = retrieveZendeskIdFromEvent(event)
  appendZendeskIdToLogger(zendeskId)

  if (zendeskId.startsWith('MR')) {
    logger.warn('Manual query detected, no need to run athena query')
    await publishToSNS(
      getEnv('EMAIL_TO_SLACK_SNS_TOPIC_ARN'),
      `Retreived Data for zendeskID: ${zendeskId}`
    )
    return
  }
  const athenaTable = await confirmAthenaTable()

  await checkAthenaTableExists(athenaTable, zendeskId)

  const requestData = await getDatabaseEntryByZendeskId(zendeskId)

  logger.info('Retrieved request details from database')

  const querySql = createQuerySql(requestData.requestInfo)

  await confirmQuerySqlGeneration(querySql, zendeskId)

  const queryExecutionDetails = await startQueryExecution(querySql)

  await confirmQueryExecution(queryExecutionDetails, zendeskId)
}

const retrieveZendeskIdFromEvent = (event: SQSEvent): string => {
  if (event.Records.length < 1) {
    throw new Error('No data in Athena Query event')
  }

  const zendeskId = event.Records[0].body
  if (zendeskId.length < 1) {
    throw new Error('No zendeskId received from SQS')
  }

  return zendeskId
}

const checkAthenaTableExists = async (
  athenaTable: ConfirmAthenaTableResult,
  zendeskId: string
): Promise<void> => {
  if (!athenaTable.tableAvailable) {
    await updateZendeskTicketById(zendeskId, athenaTable.message, 'closed')
    throw new Error(athenaTable.message)
  }
}

const confirmQuerySqlGeneration = async (
  querySql: CreateQuerySqlResult,
  zendeskId: string
): Promise<void> => {
  if (!querySql.sqlGenerated && querySql.error) {
    await updateZendeskTicketById(zendeskId, querySql.error, 'closed')
    throw new Error(querySql.error)
  }
}

const confirmQueryExecution = async (
  queryExecutionDetails: StartQueryExecutionResult,
  zendeskId: string
): Promise<void> => {
  if (!queryExecutionDetails.queryExecuted && queryExecutionDetails.error) {
    await updateZendeskTicketById(
      zendeskId,
      queryExecutionDetails.error,
      'closed'
    )
    throw new Error(queryExecutionDetails.error)
  }
  logger.info('Athena query execution initiated', {
    queryExecutionId: queryExecutionDetails.queryExecutionId
  })
  await updateDb(queryExecutionDetails, zendeskId)
}

const updateDb = async (
  queryExecutionDetails: StartQueryExecutionResult,
  zendeskId: string
): Promise<void> => {
  if (queryExecutionDetails.queryExecutionId) {
    try {
      await updateQueryByZendeskId(
        zendeskId,
        'athenaQueryId',
        queryExecutionDetails.queryExecutionId
      )
      logger.info('Updated database successfully', {
        queryExecutionId: queryExecutionDetails.queryExecutionId
      })
    } catch (error) {
      await updateZendeskTicketById(
        zendeskId,
        `Error updating db for zendesk ticket: ${zendeskId}`,
        'closed'
      )
      throw new Error(`Error updating db for zendesk ticket: ${zendeskId}`)
    }
  }
}
