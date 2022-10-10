import { ddbClient } from '../../sharedServices/dynamoDB/dynamoDBClient'
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { getEnv } from '../../utils/helpers'

export const incrementPollingRetryCount = async (
  zendeskId: string,
  glacierRestoreStillInProgress: boolean,
  copyJobStillInProgress: boolean
) => {
  if (
    (glacierRestoreStillInProgress && copyJobStillInProgress) ||
    (!glacierRestoreStillInProgress && !copyJobStillInProgress)
  ) {
    throw new Error(
      `Both glacierRestoreStillInProgress and copyJobStillInProgress should not be the same.
      glacierRestoreStillInProgress: ${glacierRestoreStillInProgress} | copyJobStillInProgress: ${copyJobStillInProgress}`
    )
  }
  const fieldToUpdate = glacierRestoreStillInProgress
    ? 'checkGlacierStatusCount'
    : 'checkCopyStatusCount'
  const params = {
    TableName: getEnv('DYNAMODB_TABLE_NAME'),
    Key: { zendeskId: { S: zendeskId } },
    UpdateExpression: `ADD ${fieldToUpdate} :increment`,
    ExpressionAttributeValues: {
      ':increment': { N: '1' }
    }
  }
  await ddbClient.send(new UpdateItemCommand(params))
}
