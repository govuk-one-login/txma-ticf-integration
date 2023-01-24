import { ddbClient } from './dynamoDBClient'
import {
  UpdateItemCommand,
  UpdateItemCommandInput
} from '@aws-sdk/client-dynamodb'
import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'

export const incrementObjectFieldByOne = async (
  zendeskId: string,
  fieldToUpdate: string
) => {
  const params = {
    TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } },
    UpdateExpression: `ADD ${fieldToUpdate} :increment`,
    ExpressionAttributeValues: {
      ':increment': { N: '1' }
    }
  }
  await ddbClient.send(new UpdateItemCommand(params))
}

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

  logger.info(`Updated item in db: ${JSON.stringify(responseObject)}`)

  return
}
