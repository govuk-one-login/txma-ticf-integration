import { ddbClient } from './dynamoDBClient'
import { UpdateItemCommand, UpdateItemInput } from '@aws-sdk/client-dynamodb'
import { getEnv } from '../../utils/helpers'

export const incrementObjectFieldByOne = async (
  zendeskId: string,
  fieldToUpdate: string
) => {
  const params = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } },
    UpdateExpression: `ADD ${fieldToUpdate} :increment`,
    ExpressionAttributeValues: {
      ':increment': { N: '1' }
    }
  }
  await updateDatabaseEntry(params)
}

const updateDatabaseEntry = async (params: UpdateItemInput) => {
  await ddbClient.send(new UpdateItemCommand(params))
}
