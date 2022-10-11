import { AttributeValue, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { isDataRequestParams } from '../../types/dataRequestParams'
import { DataRequestDatabaseEntry } from '../../types/dataRequestDatabaseEntry'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const getDatabaseEntryByZendeskId = async (
  zendeskId: string
): Promise<DataRequestDatabaseEntry> => {
  const params = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } }
  }

  const data = await ddbClient.send(new GetItemCommand(params))
  if (!data?.Item) {
    throw Error(`Cannot find database entry for zendesk ticket '${zendeskId}'`)
  }
  const responseObject = data?.Item?.requestInfo?.M

  const dataRequestParams = {
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
    dataPaths: responseObject?.dataPaths?.L?.map((path) => path.S)
  }

  if (!isDataRequestParams(dataRequestParams)) {
    throw new Error(
      `Event data returned from db was not of correct type for zendesk ticket: '${zendeskId}'`
    )
  }

  data?.Item
  return {
    requestInfo: dataRequestParams,
    checkGlacierStatusCount: retrieveNumericValue(
      data?.Item?.checkGlacierStatusCount
    ),
    checkCopyStatusCount: retrieveNumericValue(data?.Item?.checkCopyStatusCount)
  }
}

const retrieveNumericValue = (
  attributeValue: AttributeValue
): number | undefined => {
  const numericValueAsString = attributeValue?.N
  return numericValueAsString ? parseInt(numericValueAsString) : undefined
}
