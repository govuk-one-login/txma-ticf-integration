import { GetItemCommand } from '@aws-sdk/client-dynamodb'
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
