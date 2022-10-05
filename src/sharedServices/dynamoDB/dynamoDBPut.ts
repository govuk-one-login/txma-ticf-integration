import { AttributeValue, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const addNewDataRequestRecord = async (
  dataRequestParams: DataRequestParams,
  glacierRestoreInitiated: boolean,
  copyFromAuditBucketInitiated: boolean
) => {
  const newRecord: Record<string, AttributeValue> = {
    zendeskId: { S: dataRequestParams.zendeskId },
    requestInfo: {
      M: {
        zendeskId: { S: dataRequestParams.zendeskId },
        resultsEmail: { S: dataRequestParams.resultsEmail },
        resultsName: { S: dataRequestParams.resultsName },
        dateFrom: { S: dataRequestParams.dateFrom },
        dateTo: { S: dataRequestParams.dateTo },
        identifierType: { S: dataRequestParams.identifierType },
        // TODO remove these casts once we merge in change that guarantees empty arrays here
        sessionIds: {
          L: (dataRequestParams.sessionIds as string[]).map((id) => ({ S: id }))
        },
        journeyIds: {
          L: (dataRequestParams.journeyIds as string[]).map((id) => ({ S: id }))
        },
        eventIds: {
          L: (dataRequestParams.eventIds as string[]).map((id) => ({ S: id }))
        },
        userIds: {
          L: (dataRequestParams.userIds as string[]).map((id) => ({ S: id }))
        },
        piiTypes: {
          L: (dataRequestParams.piiTypes as string[]).map((id) => ({ S: id }))
        },
        dataPaths: {
          L: (dataRequestParams.dataPaths as string[]).map((id) => ({ S: id }))
        }
      }
    }
  }

  if (glacierRestoreInitiated) {
    newRecord.checkGlacierStatusCount = { N: '0' }
  }
  if (copyFromAuditBucketInitiated) {
    newRecord.checkCopyStatusCount = { N: '0' }
  }

  await ddbClient.send(
    new PutItemCommand({
      TableName: getEnv('DYNAMODB_TABLE_NAME'),
      Item: newRecord
    })
  )
}
