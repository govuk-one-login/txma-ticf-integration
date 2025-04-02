import { getDatabaseEntryByZendeskId } from '../../../common/sharedServices/dynamoDB/dynamoDBGet'
import { createQuerySql } from './createQuerySql'
import { startQueryExecution } from './startQueryExecution'
import { updateQueryByZendeskId } from '../../../common/sharedServices/dynamoDB/dynamoDBUpdate'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { CreateQuerySqlResult } from '../../../common/types/athena/createQuerySqlResult'
import { StartQueryExecutionResult } from '../../../common/types/athena/startQueryExecutionResult'
import { logger } from '../../../common/sharedServices/logger'
import { DataRequestDatabaseEntry } from '../../../common/types/dataRequestDatabaseEntry'

export const initiateQuery = async (zendeskId: string) => {
  const requestData = await getRequestData(zendeskId)

  const querySql = createQuerySql(requestData.requestInfo)
  await confirmQuerySqlGeneration(querySql, zendeskId)

  const queryExecutionDetails = await startQueryExecution(querySql)
  await confirmQueryExecution(queryExecutionDetails, zendeskId)
}

const getRequestData = async (
  zendeskId: string
): Promise<DataRequestDatabaseEntry> => {
  try {
    const requestData = await getDatabaseEntryByZendeskId(zendeskId)
    logger.info('Retrieved request details from database')

    return requestData
  } catch {
    const errorMessage = `Error retrieving request details from database for zendesk ticket: ${zendeskId}`
    await updateZendeskTicketById(zendeskId, errorMessage, 'closed')
    throw new Error(errorMessage)
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
      `Athena query execution failed for zendesk ticket: ${zendeskId}`,
      'closed'
    )
    throw queryExecutionDetails.error
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
      const errorMessage = `Error updating database for zendesk ticket: ${zendeskId}`
      await updateZendeskTicketById(zendeskId, errorMessage, 'closed')
      throw new Error(errorMessage)
    }
  }
}
