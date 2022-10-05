import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { updateQueryByZendeskId } from './dynamoDBUpdate'

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDBUpdate', () => {
  beforeEach(() => {
    dynamoMock.reset()
  })

  test('Updates a request query in database', async () => {
    dynamoMock.on(UpdateItemCommand).resolves({})

    const result = await updateQueryByZendeskId('12', 'queryExecutionId', '123')
    expect(result).toEqual('Updated queryExecutionId, with value: 123')
  })
})
