import { AttributeValue, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { DataRequestParams } from '../../types/dataRequestParams'
import { getEnv } from '../../utils/helpers'
import { ddbClient } from './dynamoDBClient'

export const addNewDataRequestRecord = (
  dataRequestParams: DataRequestParams,
  glacierRestoreInitiated: boolean,
  copyFromAuditBucketInitiated: boolean
): Promise<unknown> => {
  const newRecord: Record<string, AttributeValue> = {
    zendeskId: { S: dataRequestParams.zendeskId },
    requestInfo: {
      M: {
        zendeskId: { S: dataRequestParams.zendeskId },
        recipientEmail: { S: dataRequestParams.recipientEmail },
        recipientName: { S: dataRequestParams.recipientName },
        requesterEmail: { S: dataRequestParams.requesterEmail },
        requesterName: { S: dataRequestParams.requesterName },
        dateFrom: { S: dataRequestParams.dateFrom },
        dateTo: { S: dataRequestParams.dateTo },
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
  if (copyFromAuditBucketInitiated) {
    newRecord.checkCopyStatusCount = { N: '0' }
  }

  return ddbClient.send(
    new PutItemCommand({
      TableName: getEnv('DYNAMODB_TABLE_NAME'),
      Item: newRecord
    })
  )
}
