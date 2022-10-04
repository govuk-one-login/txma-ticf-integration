import {
  AthenaClient,
  StartQueryExecutionCommand,
  StartQueryExecutionCommandInput
} from '@aws-sdk/client-athena'
import { CreateQuerySqlResult } from '../../types/createQuerySqlResult'
import { getEnv } from '../../utils/helpers'

export const startQueryExecution = async (
  queryParams: CreateQuerySqlResult
): Promise<string> => {
  // create athena Client

  // validate queryParams

  const client = new AthenaClient({ region: getEnv('AWS_REGION') })

  // make query
  const input = generateQueryExecutionCommandInput(queryParams)

  // execute query

  const command = new StartQueryExecutionCommand(input)

  //
  const response = await client.send(command)

  return response.QueryExecutionId
}

const generateQueryExecutionCommandInput = (
  queryParams: CreateQuerySqlResult
): StartQueryExecutionCommandInput => {
  const { idParameters, sql } = queryParams
  return {
    ExecutionParameters: idParameters,
    QueryExecutionContext: {
      Database: getEnv('ATHENA_DATABASE_NAME')
    },
    QueryString: sql
  }
}
