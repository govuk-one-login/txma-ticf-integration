import { dynamoDBClient } from './dynamoDBClient'
import { QueryCommand } from '@aws-sdk/client-dynamodb'
import { getEnv } from '../helpers'
export const retrieveSecureDownloadDbRecord = async (
  zendeskId: string
): Promise<string | undefined> => {
  const results = await dynamoDBClient.send(
    new QueryCommand({
      TableName: getEnv('SECURE_DOWNLOAD_DYNAMODB_TABLE'),
      KeyConditionExpression: '#attribute = :value',
      IndexName: 'zendeskIdAndDownloadHashIndex',
      ProjectionExpression: 'zendeskId, downloadHash',
      ExpressionAttributeNames: {
        '#attribute': 'zendeskId'
      },
      ExpressionAttributeValues: { ':value': { S: `${zendeskId}` } }
    })
  )

  if (!results?.Items?.length) {
    return undefined
  }

  const result = results.Items[0]?.downloadHash.S
  if (!result) {
    return undefined
  }

  return result
}
