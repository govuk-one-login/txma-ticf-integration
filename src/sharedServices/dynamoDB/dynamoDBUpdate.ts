import {
  UpdateItemCommand,
  UpdateItemCommandInput
} from '@aws-sdk/client-dynamodb'
import { DynamoDBParams } from '../../types/dynamoDBParams'
import { isDataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const updateQueryByZendeskId = async (
  zendeskId: string,
  attributeKey: string,
  attributeValue: string
): Promise<DynamoDBParams> => {
  const params: UpdateItemCommandInput = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
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

  console.log(responseObject)

  const zendeskTicket = responseObject?.requestInfo?.M

  const dynamoDBParams = {
    zendeskId: zendeskTicket?.zendeskId?.S,
    resultsEmail: zendeskTicket?.resultsEmail?.S,
    resultsName: zendeskTicket?.resultsName?.S,
    dateFrom: zendeskTicket?.dateFrom?.S,
    dateTo: zendeskTicket?.dateTo?.S,
    identifierType: zendeskTicket?.identifierType?.S,
    sessionIds: zendeskTicket?.sessionIds?.L?.map((id) => id.S),
    journeyIds: zendeskTicket?.journeyIds?.L?.map((id) => id.S),
    eventIds: zendeskTicket?.eventIds?.L?.map((id) => id.S),
    userIds: zendeskTicket?.userIds?.L?.map((id) => id.S),
    piiTypes: zendeskTicket?.piiTypes?.L?.map((piiType) => piiType.S),
    dataPaths: zendeskTicket?.dataPaths?.L?.map((path) => path.S),
    athenaQueryId: responseObject?.athenaQueryId?.S
  }

  if (!isDataRequestParams(dynamoDBParams)) {
    throw new Error(
      `Event data returned from db following update was not of correct type for zendesk ticket: ${zendeskId}`
    )
  }

  return dynamoDBParams
}
