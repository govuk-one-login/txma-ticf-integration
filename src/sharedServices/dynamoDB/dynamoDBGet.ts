import { GetItemCommand } from '@aws-sdk/client-dynamodb'
import {
  DataRequestParams,
  isDataRequestParams
} from '../../types/dataRequestParams'
import {
  DDbQueryObject,
  UnparsedDataRequestParams
} from '../../types/dDbQueryObject'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const getQueryByZendeskId = async (
  zendeskId: string
): Promise<DataRequestParams> => {
  const data = await getDbEntryByZendeskId(zendeskId)
  const responseObject = data?.requestInfo?.M
  if (!responseObject) {
    throw new Error(
      `Request info not returned from db for zendesk ticket: ${zendeskId}`
    )
  }

  const dataRequestParams = parseDbEntryToDataRequestParamsObj(
    responseObject,
    zendeskId
  )

  return dataRequestParams
}

export const getDbEntryByZendeskId = async (
  zendeskId: string
): Promise<DDbQueryObject | undefined> => {
  const params = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } }
  }

  const data = await ddbClient.send(new GetItemCommand(params))
  console.log(data)
  return data?.Item
}

export const parseDbEntryToDataRequestParamsObj = (
  objToParse: UnparsedDataRequestParams | undefined,
  zendeskId: string
): DataRequestParams => {
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
      `Event data returned from db was not of correct type for zendesk ticket: ${zendeskId}`
    )
  }
  return dataRequestParams
}
