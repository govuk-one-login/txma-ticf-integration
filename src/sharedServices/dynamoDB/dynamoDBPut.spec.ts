import {
  PutItemCommand,
  DynamoDBClient,
  PutItemCommandInput
} from '@aws-sdk/client-dynamodb'
import { currentDateEpochSeconds } from '../../utils/currentDateEpochSeconds'
import { addNewDataRequestRecord } from './dynamoDBPut'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import {
  TEST_CURRENT_EPOCH_SECONDS,
  TEST_DATABASE_TTL_HOURS,
  TEST_DATE_FROM,
  TEST_DATE_TO,
  TEST_QUERY_DATABASE_TABLE_NAME,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  TEST_REQUESTER_EMAIL,
  TEST_REQUESTER_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { when } from 'jest-when'

jest.mock('../../utils/currentDateEpochSeconds', () => ({
  currentDateEpochSeconds: jest.fn()
}))

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDbPut', () => {
  beforeEach(() => {
    dynamoMock.reset()
    when(currentDateEpochSeconds).mockReturnValue(TEST_CURRENT_EPOCH_SECONDS)
  })

  describe('addNewDataRequestRecord', () => {
    const recordItem = {
      zendeskId: { S: ZENDESK_TICKET_ID },
      ttl: {
        N: (
          TEST_CURRENT_EPOCH_SECONDS +
          TEST_DATABASE_TTL_HOURS * 60 * 60
        ).toString()
      },
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
          piiTypes: { L: [{ S: 'passport_number' }] },
          dataPaths: { L: [] },
          sessionIds: { L: [] },
          userIds: { L: [] },
          journeyIds: { L: [] },
          identifierType: { S: 'event_id' }
        }
      }
    }

    const basicRecordExpectation: PutItemCommandInput = {
      TableName: TEST_QUERY_DATABASE_TABLE_NAME,
      Item: recordItem
    }

    it('should write a new data request record when we do not require any data to be copied', async () => {
      dynamoMock.on(PutItemCommand).resolves({})
      await addNewDataRequestRecord(testDataRequest, false, false)
      expect(dynamoMock).toHaveReceivedCommandWith(
        PutItemCommand,
        basicRecordExpectation
      )
    })

    it('should write a new data request record when we require a glacier restore', async () => {
      await addNewDataRequestRecord(testDataRequest, true, false)
      expect(dynamoMock).toHaveReceivedCommandWith(PutItemCommand, {
        TableName: TEST_QUERY_DATABASE_TABLE_NAME,
        Item: {
          ...recordItem,
          checkGlacierStatusCount: { N: '0' }
        }
      })
    })

    it('should write a new data request record when we require an audit bucket copy', async () => {
      await addNewDataRequestRecord(testDataRequest, false, true)
      expect(dynamoMock).toHaveReceivedCommandWith(PutItemCommand, {
        TableName: TEST_QUERY_DATABASE_TABLE_NAME,
        Item: {
          ...recordItem,
          checkCopyStatusCount: { N: '0' }
        }
      })
    })
  })
})
