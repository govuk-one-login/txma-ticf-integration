import { dynamoDBClient } from './dynamoDBClient'
import { QueryCommand } from '@aws-sdk/client-dynamodb'
import { getEnv, pause } from '../helpers'
const retrieveSecureDownloadDbRecord = async (
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

// does this get used at all now? Safe to remove if not?
export const waitForDownloadHash = async (
  zendeskId: string
): Promise<string> => {
  let downloadHash = await retrieveSecureDownloadDbRecord(zendeskId)
  const maxAttempts = 30
  let attempts = 0
  while (!downloadHash && attempts < maxAttempts) {
    attempts++
    await pause(2000)
    downloadHash = await retrieveSecureDownloadDbRecord(zendeskId)
  }

  if (attempts == maxAttempts) {
    throw Error(
      'Download hash not populated within reasonable time. Please check logs to ensure that data retrieval and query execution were successful'
    )
  }
  expect(downloadHash).toBeDefined()
  console.log(`DOWNLOAD HASH: ${downloadHash}`)
  return downloadHash ? downloadHash : ''
}
