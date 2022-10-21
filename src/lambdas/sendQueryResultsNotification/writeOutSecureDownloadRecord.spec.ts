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
  TEST_SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME,
  ZENDESK_TICKET_ID
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
        s3ResultsKey: { S: `${TEST_ATHENA_QUERY_ID}.csv` },
        zendeskId: { S: ZENDESK_TICKET_ID }
      }
    }
    it('should write a new secure download record', async () => {
      await writeOutSecureDownloadRecord(
        TEST_ATHENA_QUERY_ID,
        TEST_DOWNLOAD_HASH,
        ZENDESK_TICKET_ID
      )
      expect(dynamoMock).toHaveReceivedCommandWith(
        PutItemCommand,
        basicRecordExpectation
      )
    })
  })
})
