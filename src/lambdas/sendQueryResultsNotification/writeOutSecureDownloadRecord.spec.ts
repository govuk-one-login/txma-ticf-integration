import {
  PutItemCommand,
  DynamoDBClient,
  PutItemCommandInput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import {
  TEST_ATHENA_QUERY_ID,
  TEST_DOWNLOAD_HASH,
  TEST_QUERY_RESULTS_BUCKET,
  TEST_SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME
} from '../../utils/tests/testConstants'
import { writeOutSecureDownloadRecord } from './writeOutSecureDownloadRecord'

const dynamoMock = mockClient(DynamoDBClient)

describe('writeOutSecureDownloadRecord', () => {
  describe('addNewDataRequestRecord', () => {
    const basicRecordExpectation: PutItemCommandInput = {
      TableName: TEST_SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME,
      Item: {
        downloadHash: { S: TEST_DOWNLOAD_HASH },
        downloadsRemaining: { N: '3' },
        s3ResultsBucket: { S: TEST_QUERY_RESULTS_BUCKET },
        s3ResultsKey: { S: `${TEST_ATHENA_QUERY_ID}.csv` }
      }
    }
    it('should write a new secure download record', async () => {
      await writeOutSecureDownloadRecord(
        TEST_ATHENA_QUERY_ID,
        TEST_DOWNLOAD_HASH
      )
      expect(dynamoMock).toHaveReceivedCommandWith(
        PutItemCommand,
        basicRecordExpectation
      )
    })
  })
})
