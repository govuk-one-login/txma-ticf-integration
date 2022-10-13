import {
  UpdateItemCommand,
  UpdateItemCommandInput
} from '@aws-sdk/client-dynamodb'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const updateQueryByZendeskId = async (
  zendeskId: string,
  attributeKey: string,
  attributeValue: string
): Promise<void> => {
  const params: UpdateItemCommandInput = {
    TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } },
    ReturnValues: 'ALL_NEW',
    ExpressionAttributeValues: { ':value': { S: `${attributeValue}` } },
    UpdateExpression: `SET ${attributeKey}=:value`
  }

  const updatedData = await ddbClient.send(new UpdateItemCommand(params))
  const responseObject = updatedData?.Attributes

  if (!responseObject) {
    throw new Error(
      `Failed to update item in db for zendesk ticket: ${zendeskId}`
    )
  }

  console.log(`Updated item in db: ${responseObject}`)

  return
}
