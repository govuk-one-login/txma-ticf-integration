import { GetItemCommand } from '@aws-sdk/client-dynamodb'
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
  const objToParse = data?.Item?.requestInfo?.M

  const dataRequestParams = {
    zendeskId: objToParse?.zendeskId?.S,
    resultsEmail: objToParse?.resultsEmail?.S,
    resultsName: objToParse?.resultsName?.S,
    dateFrom: objToParse?.dateFrom?.S,
    dateTo: objToParse?.dateTo?.S,
    identifierType: objToParse?.identifierType?.S,
    sessionIds: objToParse?.sessionIds?.L?.map((id) => id.S),
    journeyIds: objToParse?.journeyIds?.L?.map((id) => id.S),
    eventIds: objToParse?.eventIds?.L?.map((id) => id.S),
    userIds: objToParse?.userIds?.L?.map((id) => id.S),
    piiTypes: objToParse?.piiTypes?.L?.map((piiType) => piiType.S),
    dataPaths: objToParse?.dataPaths?.L?.map((path) => path.S)
  }

  if (!isDataRequestParams(dataRequestParams)) {
    throw new Error(
      `Event data returned from db was not of correct type for zendesk ticket: '${zendeskId}'`
    )
  }

  return {
    requestInfo: dataRequestParams
  }
}
