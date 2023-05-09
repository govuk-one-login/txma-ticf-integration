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

export const initiateQuery = async (zendeskId: string) => {
  const athenaTable = await confirmAthenaTable()

  await checkAthenaTableExists(athenaTable, zendeskId)

  const requestData = await getDatabaseEntryByZendeskId(zendeskId)

  logger.info('Retrieved request details from database')

  const querySql = createQuerySql(requestData.requestInfo)

  await confirmQuerySqlGeneration(querySql, zendeskId)

  const queryExecutionDetails = await startQueryExecution(querySql)

  await confirmQueryExecution(queryExecutionDetails, zendeskId)
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
