import { startQueryExecution } from './startQueryExecution'
import { mockClient } from 'aws-sdk-client-mock'
import {
  AthenaClient,
  StartQueryExecutionCommand
} from '@aws-sdk/client-athena'

const athenaMock = mockClient(AthenaClient)

describe('start Query execution', () => {
  beforeEach(() => {
    athenaMock.reset()
  })

  test('returns a QueryExecutionId if a query is successfully initiated', async () => {
    athenaMock.on(StartQueryExecutionCommand).resolves({
      QueryExecutionId: '123'
    })

    const result = await startQueryExecution({
      sqlGenerated: true,
      queryParameters: ['test_parameter'],
      sql: 'test sql'
    })
    expect(athenaMock).toHaveReceivedCommandWith(StartQueryExecutionCommand, {
      ExecutionParameters: ['test_parameter'],
      QueryExecutionContext: {
        Database: 'test_database'
      },
      QueryString: 'test sql',
      WorkGroup: 'test_query_workgroup'
    })
    expect(result).toEqual({
      queryExecuted: true,
      queryExecutionId: '123'
    })
  })

  test('returns an error message if a query is not initiated', async () => {
    athenaMock.on(StartQueryExecutionCommand).resolves({})

    const result = await startQueryExecution({
      sqlGenerated: true,
      queryParameters: ['test_parameter'],
      sql: 'test sql'
    })
    expect(result).toEqual({
      queryExecuted: false,
      error: 'Athena query execution initiation failed'
    })
  })
})
