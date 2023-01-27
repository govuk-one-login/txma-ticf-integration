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
import { logger } from '../../sharedServices/logger'

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  logger.addContext(context)
  logger.info('Handling Athena Query event', { handledEvent: event })

  const zendeskId = retrieveZendeskIdFromEvent(event)
  logger.appendKeys({ zendeskId: zendeskId })
  const athenaTable = await confirmAthenaTable()

  await checkAthenaTableExists(athenaTable, zendeskId)

  const requestData = await getDatabaseEntryByZendeskId(zendeskId)

  const querySql = createQuerySql(requestData.requestInfo)

  await confirmQuerySqlGeneration(querySql, zendeskId)

  const queryExecutionDetails = await startQueryExecution(querySql)

  await confirmQueryExecution(queryExecutionDetails, zendeskId)

  return
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
  return
}

const confirmQuerySqlGeneration = async (
  querySql: CreateQuerySqlResult,
  zendeskId: string
): Promise<void> => {
  if (!querySql.sqlGenerated && querySql.error) {
    await updateZendeskTicketById(zendeskId, querySql.error, 'closed')
    throw new Error(querySql.error)
  }

  if (querySql.sql) {
    logger.info('Athena SQL generated', {
      sql: querySql.sql,
      parameters: querySql.queryParameters
    })
  }
  return
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

  await updateDbAndLog(queryExecutionDetails, zendeskId)
}

const updateDbAndLog = async (
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
    } catch (error) {
      await updateZendeskTicketById(
        zendeskId,
        `Error updating db for zendesk ticket: ${zendeskId}`,
        'closed'
      )
      throw new Error(`Error updating db for zendesk ticket: ${zendeskId}`)
    }
    logger.info('Athena query execution initiated', {
      QueryExecutionId: queryExecutionDetails.queryExecutionId
    })
  }
}
