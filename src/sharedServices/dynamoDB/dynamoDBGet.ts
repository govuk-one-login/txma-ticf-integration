import {
  AttributeValue,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb'
import { isDataRequestParams } from '../../types/dataRequestParams'
import { DataRequestDatabaseEntry } from '../../types/dataRequestDatabaseEntry'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const getDatabaseEntryByZendeskId = async (
  zendeskId: string
): Promise<DataRequestDatabaseEntry> => {
  const params = {
    TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } }
  }

  const data = await ddbClient.send(new GetItemCommand(params))
  if (!data?.Item) {
    throw Error(`Cannot find database entry for zendesk ticket '${zendeskId}'`)
  }
  return parseDatabaseItem(data?.Item)
}

export const getQueryByAthenaQueryId = async (
  athenaQueryId: string
): Promise<DataRequestDatabaseEntry> => {
  const params = {
    TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
    KeyConditionExpression: '#attribute = :value',
    IndexName: 'athenaQueryIdIndex',
    ProjectionExpression: 'zendeskId, athenaQueryId, requestInfo',
    ExpressionAttributeNames: { '#attribute': 'athenaQueryId' },
    ExpressionAttributeValues: { ':value': { S: `${athenaQueryId}` } }
  }

  const data = await ddbClient.send(new QueryCommand(params))
  if (!data?.Items?.length) {
    throw new Error(
      `No data returned from db for athenaQueryId: ${athenaQueryId}`
    )
  }

  return parseDatabaseItem(data.Items[0])
}

const parseDatabaseItem = (item: Record<string, AttributeValue>) => {
  const responseObject = item?.requestInfo?.M

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
    throw new Error(`Event data returned from db was not of correct type`)
  }

  return {
    requestInfo: dataRequestParams,
    checkGlacierStatusCount: retrieveNumericValue(
      item?.checkGlacierStatusCount
    ),
    checkCopyStatusCount: retrieveNumericValue(item?.checkCopyStatusCount),
    athenaQueryId: item?.athenaQueryId?.S
  }
}
const retrieveNumericValue = (
  attributeValue: AttributeValue
): number | undefined => {
  const numericValueAsString = attributeValue?.N
  return numericValueAsString ? parseInt(numericValueAsString) : undefined
}
