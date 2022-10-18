import {
  PutItemCommand,
  DynamoDBClient,
  PutItemCommandInput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { addNewDataRequestRecord } from './dynamoDBPut'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import {
  TEST_DATE_FROM,
  TEST_DATE_TO,
  TEST_QUERY_DATABASE_TABLE_NAME,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDbPut', () => {
  beforeEach(() => {
    dynamoMock.reset()
  })
  describe('addNewDataRequestRecord', () => {
    const basicRecordExpectation: PutItemCommandInput = {
      TableName: TEST_QUERY_DATABASE_TABLE_NAME,
      Item: {
        zendeskId: { S: ZENDESK_TICKET_ID },
        requestInfo: {
          M: {
            zendeskId: { S: ZENDESK_TICKET_ID },
            recipientEmail: { S: TEST_RECIPIENT_EMAIL },
            recipientName: { S: TEST_RECIPIENT_NAME },
            requesterEmail: { S: TEST_REQUESTER_EMAIL },
            requesterName: { S: TEST_REQUESTER_NAME },
            dateFrom: { S: TEST_DATE_FROM },
            dateTo: { S: TEST_DATE_TO },
            eventIds: { L: [{ S: '123' }, { S: '456' }] },
            piiTypes: { L: [{ S: 'passport_number' }] }
          }
        }
      }
    }
    it('should write a new data request record when we do not require any data to be copied', async () => {
      await addNewDataRequestRecord(testDataRequest, false, false)
      expect(dynamoMock).toHaveReceivedCommandWith(
        PutItemCommand,
        basicRecordExpectation
      )
    })

    it('should write a new data request record when we require a glacier restore', async () => {
      await addNewDataRequestRecord(testDataRequest, true, false)
      expect(dynamoMock).toHaveReceivedCommandWith(PutItemCommand, {
        ...basicRecordExpectation,
        Item: {
          checkGlacierStatusCount: { N: '0' }
        }
      })
    })

    it('should write a new data request record when we require an audit bucket copy', async () => {
      await addNewDataRequestRecord(testDataRequest, false, true)
      expect(dynamoMock).toHaveReceivedCommandWith(PutItemCommand, {
        ...basicRecordExpectation,
        Item: {
          checkCopyStatusCount: { N: '0' }
        }
      })
    })
  })
})
