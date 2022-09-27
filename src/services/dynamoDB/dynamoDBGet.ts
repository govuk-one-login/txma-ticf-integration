import { GetItemCommand } from '@aws-sdk/client-dynamodb'
import {
  DataRequestParams,
  isDataRequestParams
} from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const getQueryByZendeskId = async (
  zendeskId: string
): Promise<DataRequestParams> => {
  const params = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } }
  }

  const data = await ddbClient.send(new GetItemCommand(params))
  console.log(data)
  console.log(data.Item?.requestInfo?.M)
  if (!data.Item?.requestInfo?.M) {
    throw new Error(
      `Request info not returned from db for zendesk ticket: ${zendeskId}`
    )
  }

  if (!isDataRequestParams(data.Item?.requestInfo?.M)) {
    throw new Error(
      `Event data returned from db was not of correct type for zendesk ticket: ${zendeskId}`
    )
  }

  return data.Item?.requestInfo?.M as DataRequestParams
}
