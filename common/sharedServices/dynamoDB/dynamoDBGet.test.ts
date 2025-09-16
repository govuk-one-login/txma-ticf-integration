import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  GetItemOutput,
  QueryCommand,
  QueryCommandOutput,
  QueryOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import {
  TEST_ATHENA_QUERY_ID,
  TEST_DATE_1,
  TEST_DATE_2,
  TEST_QUERY_DATABASE_TABLE_NAME
} from '../../../common/utils/tests/testConstants'
import {
  getDatabaseEntryByZendeskId,
  getQueryByAthenaQueryId
} from './dynamoDBGet'
import 'aws-sdk-client-mock-jest'

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDBGet', () => {
  beforeEach(() => {
    dynamoMock.reset()
  })

  const givenDatabaseReturnsData = (
    parameters:
      | {
          checkGlacierStatusCount?: number
          athenaQueryId?: string
          isLegacyRecordWithDateFromTo?: boolean
        }
      | undefined = undefined
  ) => {
    const mockItem: Record<string, AttributeValue> = {
      requestInfo: {
        M: {
          recipientEmail: { S: 'test@example.com' },
          recipientName: { S: 'test' },
          requesterEmail: { S: 'test@example.com' },
          requesterName: { S: 'test' },
          identifierType: { S: 'eventId' },
          ...(!parameters?.isLegacyRecordWithDateFromTo && {
            dates: { L: [{ S: TEST_DATE_1 }, { S: TEST_DATE_2 }] }
          }),
          ...(parameters?.isLegacyRecordWithDateFromTo && {
            dateFrom: { S: TEST_DATE_1 },
            dateTo: { S: TEST_DATE_1 }
          }),
          zendeskId: { S: '12' },
          eventIds: { L: [{ S: '234gh24' }, { S: '98h98bc' }] },
          sessionIds: { L: [] },
          userIds: { L: [] },
          journeyIds: { L: [] },
          piiTypes: { L: [{ S: 'passport_number' }] },
          dataPaths: { L: [] }
        }
      },
      zendeskId: { S: '12' },
      ...(parameters?.athenaQueryId && {
        athenaQueryId: { S: parameters?.athenaQueryId }
      }),
      ...(parameters?.checkGlacierStatusCount && {
        checkGlacierStatusCount: {
          N: parameters?.checkGlacierStatusCount.toString()
        }
      })
    }
    const mockDbGetContents = {
      Item: mockItem
    }
    dynamoMock.on(GetItemCommand).resolves(mockDbGetContents as GetItemOutput)

    const mockDbQueryContents = {
      Items: [mockItem]
    }
    dynamoMock.on(QueryCommand).resolves(mockDbQueryContents as QueryOutput)
  }

  describe('getDatabaseEntryByZendeskId', () => {
    test('Finds valid request query in database', async () => {
      givenDatabaseReturnsData()

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.requestInfo).toEqual({
        recipientEmail: 'test@example.com',
        recipientName: 'test',
        requesterEmail: 'test@example.com',
        requesterName: 'test',
        dates: [TEST_DATE_1, TEST_DATE_2],
        identifierType: 'eventId',
        zendeskId: '12',
        eventIds: ['234gh24', '98h98bc'],
        journeyIds: [],
        sessionIds: [],
        userIds: [],
        dataPaths: [],
        piiTypes: ['passport_number']
      })

      expect(result.checkGlacierStatusCount).toBeUndefined()
    })

    test('Supports legacy record with dateFrom instead of dates', async () => {
      givenDatabaseReturnsData({ isLegacyRecordWithDateFromTo: true })

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.requestInfo).toEqual({
        recipientEmail: 'test@example.com',
        recipientName: 'test',
        requesterEmail: 'test@example.com',
        requesterName: 'test',
        dates: [TEST_DATE_1],
        identifierType: 'eventId',
        zendeskId: '12',
        eventIds: ['234gh24', '98h98bc'],
        piiTypes: ['passport_number'],
        journeyIds: [],
        sessionIds: [],
        userIds: [],
        dataPaths: []
      })

      expect(result.checkGlacierStatusCount).toBeUndefined()
    })

    test('parses checkGlacierStatusCount if set', async () => {
      const checkGlacierStatusCount = 1
      givenDatabaseReturnsData({ checkGlacierStatusCount })

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.checkGlacierStatusCount).toEqual(checkGlacierStatusCount)
    })

    test('parses athenaQueryId if set', async () => {
      const athenaQueryId = 'abc123'
      givenDatabaseReturnsData({ athenaQueryId })

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.athenaQueryId).toEqual(athenaQueryId)
      expect(result.checkGlacierStatusCount).toBeUndefined()
    })

    test('Does not find request query in database - empty object response', async () => {
      dynamoMock.on(GetItemCommand).resolves({} as GetItemOutput)

      await expect(getDatabaseEntryByZendeskId('12')).rejects.toThrow(
        `Cannot find database entry for zendesk ticket '12'`
      )
    })

    test('Does not find request query in database - undefined response', async () => {
      dynamoMock
        .on(GetItemCommand)
        .resolves(undefined as unknown as QueryCommandOutput)

      await expect(getDatabaseEntryByZendeskId('12')).rejects.toThrow(
        `Cannot find database entry for zendesk ticket '12'`
      )
    })

    test('Finds Request query but cant turn info into a valid query', async () => {
      const mockDbContents = {
        Item: {
          requestInfo: {
            M: {
              notAValue: { S: 'fake' }
            },
            zendeskId: { S: '12' }
          }
        }
      }

      dynamoMock.on(GetItemCommand).resolves(mockDbContents)

      await expect(getDatabaseEntryByZendeskId('12')).rejects.toThrow(
        `Event data returned from db was not of correct type`
      )
    })
  })
  describe('getQueryByAthenaQueryId', () => {
    const testParams = {
      TableName: TEST_QUERY_DATABASE_TABLE_NAME,
      KeyConditionExpression: '#attribute = :value',
      IndexName: 'athenaQueryIdIndex',
      ProjectionExpression: 'zendeskId, athenaQueryId, requestInfo',
      ExpressionAttributeNames: { '#attribute': 'athenaQueryId' },
      ExpressionAttributeValues: { ':value': { S: `${TEST_ATHENA_QUERY_ID}` } }
    }

    it('should retrieve a record by athena query id', async () => {
      givenDatabaseReturnsData({ athenaQueryId: TEST_ATHENA_QUERY_ID })

      const result = await getQueryByAthenaQueryId(TEST_ATHENA_QUERY_ID)

      expect(dynamoMock).toHaveReceivedCommandWith(QueryCommand, testParams)
      expect(result.requestInfo).toEqual({
        recipientEmail: 'test@example.com',
        recipientName: 'test',
        requesterEmail: 'test@example.com',
        requesterName: 'test',
        dates: [TEST_DATE_1, TEST_DATE_2],
        identifierType: 'eventId',
        zendeskId: '12',
        eventIds: ['234gh24', '98h98bc'],
        piiTypes: ['passport_number'],
        journeyIds: [],
        sessionIds: [],
        userIds: [],
        dataPaths: []
      })
      expect(result.athenaQueryId).toEqual(TEST_ATHENA_QUERY_ID)
    })

    it('Does not find request query in database - empty array response', async () => {
      dynamoMock.on(QueryCommand).resolves({ Items: [] } as QueryOutput)

      expect(getQueryByAthenaQueryId(TEST_ATHENA_QUERY_ID)).rejects.toThrow(
        `No data returned from db for athenaQueryId: ${TEST_ATHENA_QUERY_ID}`
      )
      expect(dynamoMock).toHaveReceivedCommandWith(QueryCommand, testParams)
    })

    it('Does not find request query in database - undefined response', async () => {
      dynamoMock
        .on(QueryCommand)
        .resolves(undefined as unknown as QueryCommandOutput)

      expect(getQueryByAthenaQueryId(TEST_ATHENA_QUERY_ID)).rejects.toThrow(
        `No data returned from db for athenaQueryId: ${TEST_ATHENA_QUERY_ID}`
      )
      expect(dynamoMock).toHaveReceivedCommandWith(QueryCommand, testParams)
    })
  })

  describe('parseDatabaseItem edge cases', () => {
    it('handles checkGlacierStatusCount with no N attribute', async () => {
      const mockItem: Record<string, AttributeValue> = {
        requestInfo: {
          M: {
            recipientEmail: { S: 'test@example.com' },
            recipientName: { S: 'test' },
            requesterEmail: { S: 'test@example.com' },
            requesterName: { S: 'test' },
            identifierType: { S: 'eventId' },
            dates: { L: [{ S: TEST_DATE_1 }] },
            zendeskId: { S: '12' },
            eventIds: { L: [] },
            sessionIds: { L: [] },
            userIds: { L: [] },
            journeyIds: { L: [] },
            piiTypes: { L: [] },
            dataPaths: { L: [] }
          }
        },
        zendeskId: { S: '12' },
        checkGlacierStatusCount: { S: 'not-a-number' }
      }

      dynamoMock
        .on(GetItemCommand)
        .resolves({ Item: mockItem } as GetItemOutput)

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.checkGlacierStatusCount).toBeUndefined()
    })

    it('handles all optional ID arrays with values', async () => {
      const mockItem: Record<string, AttributeValue> = {
        requestInfo: {
          M: {
            recipientEmail: { S: 'test@example.com' },
            recipientName: { S: 'test' },
            requesterEmail: { S: 'test@example.com' },
            requesterName: { S: 'test' },
            identifierType: { S: 'eventId' },
            dates: { L: [{ S: TEST_DATE_1 }] },
            zendeskId: { S: '12' },
            eventIds: { L: [{ S: 'event1' }] },
            sessionIds: { L: [{ S: 'session1' }, { S: 'session2' }] },
            userIds: { L: [{ S: 'user1' }] },
            journeyIds: { L: [{ S: 'journey1' }] },
            piiTypes: { L: [{ S: 'pii1' }] },
            dataPaths: { L: [{ S: 'path1' }] }
          }
        },
        zendeskId: { S: '12' }
      }

      dynamoMock
        .on(GetItemCommand)
        .resolves({ Item: mockItem } as GetItemOutput)

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.requestInfo.sessionIds).toEqual(['session1', 'session2'])
      expect(result.requestInfo.userIds).toEqual(['user1'])
      expect(result.requestInfo.journeyIds).toEqual(['journey1'])
      expect(result.requestInfo.eventIds).toEqual(['event1'])
      expect(result.requestInfo.piiTypes).toEqual(['pii1'])
      expect(result.requestInfo.dataPaths).toEqual(['path1'])
    })
  })
})
