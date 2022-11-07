import { PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb'
import { ddbClient } from '../../sharedServices/dynamoDB/dynamoDBClient'
import { currentDateEpochMilliseconds } from '../../utils/currentDateEpochMilliseconds'
import { getEnv } from '../../utils/helpers'

export const writeOutSecureDownloadRecord = async (
  athenaQueryId: string,
  downloadHash: string,
  zendeskId: string
) => {
  const putCommand: PutItemCommandInput = {
    TableName: getEnv('SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME'),
    Item: {
      downloadHash: { S: downloadHash },
      downloadsRemaining: { N: '2' },
      s3ResultsKey: { S: `${athenaQueryId}.csv` },
      s3ResultsBucket: { S: getEnv('QUERY_RESULTS_BUCKET_NAME') },
      zendeskId: { S: zendeskId },
      createdDate: { N: currentDateEpochMilliseconds().toString() }
    }
  }

  console.log(`Writing secure download record for zendeskId ${zendeskId}`)

  await ddbClient.send(new PutItemCommand(putCommand))
}
