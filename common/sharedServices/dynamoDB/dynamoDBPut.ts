import { AttributeValue, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DataRequestParams } from '../../../common/types/dataRequestParams'
import { currentDateEpochSeconds } from '../../utils/currentDateEpochSeconds'
import { getEnv } from '../../../common/utils/helpers'
import { ddbClient } from '../../utils/awsSdkClients'

export const addNewDataRequestRecord = (
  dataRequestParams: DataRequestParams,
  glacierRestoreInitiated: boolean
): Promise<unknown> => {
  const recordExpiryTimeSeconds =
    currentDateEpochSeconds() + parseInt(getEnv('DATABASE_TTL_HOURS')) * 60 * 60
  const newRecord: Record<string, AttributeValue> = {
    zendeskId: { S: dataRequestParams.zendeskId },
    ttl: { N: recordExpiryTimeSeconds.toString() },
    requestInfo: {
      M: {
        zendeskId: { S: dataRequestParams.zendeskId },
        recipientEmail: { S: dataRequestParams.recipientEmail },
        recipientName: { S: dataRequestParams.recipientName },
        requesterEmail: { S: dataRequestParams.requesterEmail },
        requesterName: { S: dataRequestParams.requesterName },
        dates: { L: dataRequestParams.dates.map((date) => ({ S: date })) },
        identifierType: { S: dataRequestParams.identifierType },
        sessionIds: {
          L: dataRequestParams.sessionIds.map((id) => ({ S: id }))
        },
        journeyIds: {
          L: dataRequestParams.journeyIds.map((id) => ({ S: id }))
        },
        eventIds: {
          L: dataRequestParams.eventIds.map((id) => ({ S: id }))
        },
        userIds: {
          L: dataRequestParams.userIds.map((id) => ({ S: id }))
        },
        piiTypes: {
          L: dataRequestParams.piiTypes.map((id) => ({ S: id }))
        },
        dataPaths: {
          L: dataRequestParams.dataPaths.map((id) => ({ S: id }))
        }
      }
    }
  }

  if (glacierRestoreInitiated) {
    newRecord.checkGlacierStatusCount = { N: '0' }
  }

  return ddbClient.send(
    new PutItemCommand({
      TableName: getEnv('QUERY_REQUEST_DYNAMODB_TABLE_NAME'),
      Item: newRecord
    })
  )
}
