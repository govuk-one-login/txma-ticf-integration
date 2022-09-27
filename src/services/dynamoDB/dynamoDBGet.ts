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
  console.log(data.Item?.requestInfo?.M?.eventIds?.L)
  if (!data.Item?.requestInfo?.M) {
    throw new Error(
      `Request info not returned from db for zendesk ticket: ${zendeskId}`
    )
  }

  const dataRequestParams = {
    zendeskId: data.Item?.requestInfo?.M?.zendeskId?.S,
    resultsEmail: data.Item?.requestInfo?.M?.resultsEmail?.S,
    resultsName: data.Item?.requestInfo?.M?.resultsName?.S,
    dateFrom: data.Item?.requestInfo?.M?.dateFrom?.S,
    dateTo: data.Item?.requestInfo?.M?.dateTo?.S,
    identifierType: data.Item?.requestInfo?.M?.identifierType?.S
    // sessionIds?: string[]
    // journeyIds?: string[]
    // eventIds?: string[]
    // userIds?: string[]
    // piiTypes?: string[]
    // dataPaths?: string[]
  }

  if (!isDataRequestParams(dataRequestParams)) {
    throw new Error(
      `Event data returned from db was not of correct type for zendesk ticket: ${zendeskId}`
    )
  }

  return dataRequestParams
}
