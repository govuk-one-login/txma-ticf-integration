import { incrementObjectFieldByOne } from './dynamoDBUpdate'
import {
  TEST_QUERY_DATABASE_TABLE_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'

const dynamoMock = mockClient(DynamoDBClient)
const myFieldToUpdate = 'myFieldToUpdate'
const testParams = {
  TableName: TEST_QUERY_DATABASE_TABLE_NAME,
  Key: { zendeskId: { S: ZENDESK_TICKET_ID } },
  UpdateExpression: `ADD ${myFieldToUpdate} :increment`,
  ExpressionAttributeValues: {
    ':increment': { N: '1' }
  }
}

describe('incrementObjectFieldByOne', () => {
  it('should call the send function with the correct parameters', async () => {
    await incrementObjectFieldByOne(ZENDESK_TICKET_ID, myFieldToUpdate)

    expect(dynamoMock).toHaveReceivedCommandWith(UpdateItemCommand, testParams)
  })
})
