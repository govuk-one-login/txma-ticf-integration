import {
  incrementObjectFieldByOne,
  updateQueryByZendeskId
} from './dynamoDBUpdate'
import {
  TEST_QUERY_DATABASE_TABLE_NAME,
  ZENDESK_TICKET_ID
} from '../../../common/utils/tests/testConstants'
import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDbUpdate', () => {
  describe('incrementObjectFieldByOne', () => {
    const myFieldToUpdate = 'myFieldToUpdate'
    const testParams = {
      TableName: TEST_QUERY_DATABASE_TABLE_NAME,
      Key: { zendeskId: { S: ZENDESK_TICKET_ID } },
      UpdateExpression: `ADD ${myFieldToUpdate} :increment`,
      ExpressionAttributeValues: {
        ':increment': { N: '1' }
      }
    }

    it('should call the send function with the correct parameters', async () => {
      await incrementObjectFieldByOne(ZENDESK_TICKET_ID, myFieldToUpdate)
      expect(dynamoMock).toHaveReceivedCommandWith(
        UpdateItemCommand,
        testParams
      )
    })
  })

  describe('dynamoDBUpdate', () => {
    beforeEach(() => {
      dynamoMock.reset()
    })

    test('Updates a request query in database', async () => {
      const mockUpdatedDbContents = {
        Attributes: {
          requestInfo: {
            M: {
              recipientName: { S: 'test' },
              dateTo: { S: '2022-09-06' },
              identifierType: { S: 'eventId' },
              dateFrom: { S: '2022-09-06' },
              zendeskId: { S: '12' },
              eventIds: { L: [{ S: '234gh24' }, { S: '98h98bc' }] },
              piiTypes: { L: [{ S: 'passport_number' }] },
              recipientEmail: { S: 'test@example.com' },
              requesterEmail: { S: 'test@example.com' },
              requesterName: { S: 'test' }
            }
          },
          zendeskId: { S: '12' },
          athenaQueryId: { S: 'testAthenaId' }
        }
      }

      dynamoMock
        .on(UpdateItemCommand)
        .resolves(mockUpdatedDbContents as UpdateItemOutput)

      await expect(
        updateQueryByZendeskId('12', 'athenaQueryId', 'testAthenaId')
      ).resolves.not.toThrow()
      expect(dynamoMock).toHaveReceivedCommandWith(UpdateItemCommand, {
        TableName: TEST_QUERY_DATABASE_TABLE_NAME,
        Key: { zendeskId: { S: '12' } },
        ReturnValues: 'ALL_NEW',
        ExpressionAttributeValues: { ':value': { S: 'testAthenaId' } },
        UpdateExpression: 'SET athenaQueryId=:value'
      })
    })

    test('Does not find request query in database - empty object response', async () => {
      dynamoMock.on(UpdateItemCommand).resolves({} as UpdateItemOutput)

      await expect(
        updateQueryByZendeskId('12', 'athenaQueryId', 'testAthenaId')
      ).rejects.toThrow('Failed to update item in db for zendesk ticket: 12')
    })

    test('Does not find request query in database - undefined response', async () => {
      dynamoMock
        .on(UpdateItemCommand)
        .resolves(undefined as unknown as UpdateItemOutput)

      await expect(
        updateQueryByZendeskId('12', 'athenaQueryId', 'testAthenaId')
      ).rejects.toThrow('Failed to update item in db for zendesk ticket: 12')
    })
  })
})
