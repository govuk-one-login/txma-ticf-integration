import {
  AthenaClient,
  StartQueryExecutionCommand,
  StartQueryExecutionCommandInput
} from '@aws-sdk/client-athena'
import { CreateQuerySqlResult } from '../../types/athena/createQuerySqlResult'
import { StartQueryExecutionResult } from '../../types/athena/startQueryExecutionResult'
import { getEnv } from '../../utils/helpers'

export const startQueryExecution = async (
  queryParams: CreateQuerySqlResult
): Promise<StartQueryExecutionResult> => {
  // validate queryParams
  console.log('Attempting to start Athena query execution')

  const client = new AthenaClient({ region: getEnv('AWS_REGION') })

  const input = generateQueryExecutionCommandInput(queryParams)
  console.log(input)

  const command = new StartQueryExecutionCommand(input)

  const response = await client.send(command)

  if (!response.QueryExecutionId) {
    return {
      queryExecuted: false,
      error: 'Athena query execution initiation failed'
    }
  }

  return {
    queryExecuted: true,
    queryExecutionId: response.QueryExecutionId
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
