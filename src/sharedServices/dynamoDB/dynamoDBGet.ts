import { GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import {
  QueryRequestDBParams,
  isQueryRequestDBParams
} from '../../types/queryRequestDBParams'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const getQueryByZendeskId = async (
  zendeskId: string
): Promise<QueryRequestDBParams> => {
  const params = {
    TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } }
  }

  const data = await ddbClient.send(new GetItemCommand(params))
  console.log(data)
  const responseObject = data?.Item?.requestInfo?.M
  if (!responseObject) {
    throw new Error(
      `Request info not returned from db for zendesk ticket: ${zendeskId}`
    )
  }

  const queryRequestDBParams = {
    zendeskId: responseObject?.zendeskId?.S,
    recipientEmail: responseObject?.recipientEmail?.S,
    recipientName: responseObject?.recipientName?.S,
    requesterEmail: responseObject?.requesterEmail?.S,
    requesterName: responseObject?.requesterName?.S,
    dateFrom: responseObject?.dateFrom?.S,
    dateTo: responseObject?.dateTo?.S,
    identifierType: responseObject?.identifierType?.S,
    sessionIds: responseObject?.sessionIds?.L?.map((id) => id.S),
    journeyIds: responseObject?.journeyIds?.L?.map((id) => id.S),
    eventIds: responseObject?.eventIds?.L?.map((id) => id.S),
    userIds: responseObject?.userIds?.L?.map((id) => id.S),
    piiTypes: responseObject?.piiTypes?.L?.map((piiType) => piiType.S),
    dataPaths: responseObject?.dataPaths?.L?.map((path) => path.S),
    athenaQueryId: data?.Item?.athenaQueryId?.S
  }

  if (!isQueryRequestDBParams(queryRequestDBParams)) {
    throw new Error(
      `Event data returned from db was not of correct type for zendesk ticket: ${zendeskId}`
    )
  }

  return queryRequestDBParams
}

export const getQueryByAthenaQueryId = async (
  athenaQueryId: string
): Promise<QueryRequestDBParams> => {
  const params = {
    TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
    KeyConditionExpression: '#attribute = :value',
    IndexName: 'athenaQueryIdIndex',
    ExpressionAttributeNames: { '#attribute': 'athenaQueryId' },
    ExpressionAttributeValues: { ':value': { S: `${athenaQueryId}` } }
  }

  const data = await ddbClient.send(new QueryCommand(params))
  if (!data.Items) {
    throw new Error(
      `No data returned from db for athenaQueryId: ${athenaQueryId}`
    )
  }
  console.log(data)

  const responseItem = data.Items[0]
  const zendeskRequest = responseItem.requestInfo?.M

  const queryRequestDBParams = {
    zendeskId: zendeskRequest?.zendeskId?.S,
    recipientEmail: zendeskRequest?.recipientEmail?.S,
    recipientName: zendeskRequest?.recipientName?.S,
    requesterEmail: zendeskRequest?.requesterEmail?.S,
    requesterName: zendeskRequest?.requesterName?.S,
    dateFrom: zendeskRequest?.dateFrom?.S,
    dateTo: zendeskRequest?.dateTo?.S,
    identifierType: zendeskRequest?.identifierType?.S,
    sessionIds: zendeskRequest?.sessionIds?.L?.map((id) => id.S),
    journeyIds: zendeskRequest?.journeyIds?.L?.map((id) => id.S),
    eventIds: zendeskRequest?.eventIds?.L?.map((id) => id.S),
    userIds: zendeskRequest?.userIds?.L?.map((id) => id.S),
    piiTypes: zendeskRequest?.piiTypes?.L?.map((piiType) => piiType.S),
    dataPaths: zendeskRequest?.dataPaths?.L?.map((path) => path.S),
    athenaQueryId: responseItem?.athenaQueryId?.S
  }

  if (!isQueryRequestDBParams(queryRequestDBParams)) {
    throw new Error(
      `Event data returned from db was not of correct type for athenaQueryId: ${athenaQueryId}`
    )
  }

  return queryRequestDBParams
}
