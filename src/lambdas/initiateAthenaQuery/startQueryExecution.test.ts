import { startQueryExecution } from './startQueryExecution'
import {
  AthenaClient,
  StartQueryExecutionCommand
} from '@aws-sdk/client-athena'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import * as awsSdkClients from '../../../common/utils/awsSdkClients'

const athenaMock = mockClient(AthenaClient)

describe('start Query execution', () => {
  beforeEach(() => {
    athenaMock.reset()
  })

  it('returns a QueryExecutionId if a query is successfully initiated', async () => {
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

  it('returns an error if a query execution id is not returned', async () => {
    athenaMock.on(StartQueryExecutionCommand).resolves({})

    const result = await startQueryExecution({
      sqlGenerated: true,
      queryParameters: ['test_parameter'],
      sql: 'test sql'
    })
    expect(result).toEqual({
      queryExecuted: false,
      error: new Error('Athena query execution id not found in response')
    })
  })

  it('returns an error if the StartQueryExecutionCommand fails', async () => {
    const testError = new Error('Athena query execution initiation failed')
    athenaMock.on(StartQueryExecutionCommand).rejects(testError)

    const result = await startQueryExecution({
      sqlGenerated: true,
      queryParameters: ['test_parameter'],
      sql: 'test sql'
    })
    expect(result).toEqual({
      queryExecuted: false,
      error: testError
    })
  })

  it('returns a generic error if the StartQueryExecutionCommand fails with a non-Error object', async () => {
    athenaMock.on(StartQueryExecutionCommand).rejects('string error')

    const result = await startQueryExecution({
      sqlGenerated: true,
      queryParameters: ['test_parameter'],
      sql: 'test sql'
    })
    expect(result).toEqual({
      queryExecuted: false,
      error: new Error('string error')
    })
  })

  it('returns a generic "Unknown error" when athenaClient.send throws a non-Error object', async () => {
    const originalSend = awsSdkClients.athenaClient.send
    awsSdkClients.athenaClient.send = jest.fn().mockRejectedValue(42)

    const result = await startQueryExecution({
      sqlGenerated: true,
      queryParameters: ['test_parameter'],
      sql: 'test sql'
    })

    expect(result).toEqual({
      queryExecuted: false,
      error: new Error('Unknown error')
    })

    awsSdkClients.athenaClient.send = originalSend
  })
})
