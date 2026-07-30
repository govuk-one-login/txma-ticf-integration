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
  } catch (error) {
    logger.error('Error retrieving request details from database', {
      errorCode: 'TICF016',
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      }
    })
    await updateZendeskTicketById(
      zendeskId,
      'Error retrieving request details from database',
      'closed'
    )
    throw new Error('Error retrieving request details from database', {
      cause: error
    })
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
      'Athena query execution failed',
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
      logger.error('Error updating database', {
        errorCode: 'TICF017',
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : undefined,
          stack: error instanceof Error ? error.stack : undefined
        }
      })
      await updateZendeskTicketById(
        zendeskId,
        'Error updating database',
        'closed'
      )
      throw new Error('Error updating database', { cause: error })
    }
  }
}
