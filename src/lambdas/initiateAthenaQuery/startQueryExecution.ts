import {
  StartQueryExecutionCommand,
  StartQueryExecutionCommandInput
} from '@aws-sdk/client-athena'
import { logger } from '../../../common/sharedServices/logger'
import { CreateQuerySqlResult } from '../../../common/types/athena/createQuerySqlResult'
import { StartQueryExecutionResult } from '../../../common/types/athena/startQueryExecutionResult'
import { getEnv } from '../../../common/utils/helpers'
import { athenaClient } from '../../../common/utils/awsSdkClients'

export const startQueryExecution = async (
  queryParams: CreateQuerySqlResult
): Promise<StartQueryExecutionResult> => {
  const input = generateQueryExecutionCommandInput(queryParams)
  const command = new StartQueryExecutionCommand(input)

  try {
    const response = await athenaClient.send(command)

    if (!response.QueryExecutionId) {
      const error = new Error('Athena query execution id not found in response')
      logger.error(error.message, { error })

      return {
        queryExecuted: false,
        error
      }
    }

    return {
      queryExecuted: true,
      queryExecutionId: response.QueryExecutionId
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Athena query execution initiation failed', { error })

      return {
        queryExecuted: false,
        error
      }
    } else {
      return {
        queryExecuted: false,
        error: new Error('Unknown error')
      }
    }
  }
}

const generateQueryExecutionCommandInput = (
  queryParams: CreateQuerySqlResult
): StartQueryExecutionCommandInput => {
  const { queryParameters, sql } = queryParams
  return {
    ExecutionParameters: queryParameters,
    QueryExecutionContext: {
      Database: getEnv('ATHENA_DATABASE_NAME')
    },
    QueryString: sql,
    WorkGroup: getEnv('ATHENA_WORKGROUP_NAME')
  }
}
