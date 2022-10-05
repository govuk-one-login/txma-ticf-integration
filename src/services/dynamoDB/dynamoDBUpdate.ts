import {
  UpdateItemCommand,
  UpdateItemCommandInput
} from '@aws-sdk/client-dynamodb'
// import {
//   DataRequestParams,
//   isDataRequestParams
// } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const updateQueryByZendeskId = async (
  zendeskId: string,
  attributeKey: string,
  attributeValue: string
): Promise<string> => {
  const params: UpdateItemCommandInput = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } },
    ReturnValues: 'UPDATED_NEW',
    ExpressionAttributeValues: { ':value': { S: `${attributeValue}` } },
    UpdateExpression: `SET ${attributeKey}=:value`
  }

  const updatedData = await ddbClient.send(new UpdateItemCommand(params))
  console.log(updatedData)
  // const responseObject = data?.Item?.requestInfo?.M
  // if (!responseObject) {
  //   throw new Error(
  //     `Request info not returned from db for zendesk ticket: ${zendeskId}`
  //   )
  // }

  // const dataRequestParams = {
  //   zendeskId: responseObject?.zendeskId?.S,
  //   resultsEmail: responseObject?.resultsEmail?.S,
  //   resultsName: responseObject?.resultsName?.S,
  //   dateFrom: responseObject?.dateFrom?.S,
  //   dateTo: responseObject?.dateTo?.S,
  //   identifierType: responseObject?.identifierType?.S,
  //   sessionIds: responseObject?.sessionIds?.L?.map((id) => id.S),
  //   journeyIds: responseObject?.journeyIds?.L?.map((id) => id.S),
  //   eventIds: responseObject?.eventIds?.L?.map((id) => id.S),
  //   userIds: responseObject?.userIds?.L?.map((id) => id.S),
  //   piiTypes: responseObject?.piiTypes?.L?.map((piiType) => piiType.S),
  //   dataPaths: responseObject?.dataPaths?.L?.map((path) => path.S)
  // }

  // if (!isDataRequestParams(dataRequestParams)) {
  //   throw new Error(
  //     `Event data returned from db was not of correct type for zendesk ticket: ${zendeskId}`
  //   )
  // }

  return `Updated ${attributeKey}, with value: ${attributeValue}`
}
