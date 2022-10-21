import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  GetItemOutput,
  QueryCommand,
  QueryOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import {
  TEST_ATHENA_QUERY_ID,
  TEST_QUERY_DATABASE_TABLE_NAME
} from '../../utils/tests/testConstants'
import {
  getDatabaseEntryByZendeskId,
  getQueryByAthenaQueryId
} from './dynamoDBGet'

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDBGet', () => {
  beforeEach(() => {
    dynamoMock.reset()
  })

  const givenDatabaseReturnsData = (
    parameters:
      | {
          checkGlacierStatusCount?: number
          checkCopyStatusCount?: number
          athenaQueryId?: string
        }
      | undefined = undefined
  ) => {
    const mockItem: Record<string, AttributeValue> = {
      requestInfo: {
        M: {
          recipientEmail: { S: 'test@test.gov.uk' },
          recipientName: { S: 'test' },
          requesterEmail: { S: 'test@test.gov.uk' },
          requesterName: { S: 'test' },
          dateTo: { S: '2022-09-06' },
          identifierType: { S: 'eventId' },
          dateFrom: { S: '2022-09-06' },
          zendeskId: { S: '12' },
          eventIds: { L: [{ S: '234gh24' }, { S: '98h98bc' }] },
          piiTypes: { L: [{ S: 'passport_number' }] }
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
      }),
      ...(parameters?.checkCopyStatusCount && {
        checkCopyStatusCount: { N: parameters?.checkCopyStatusCount.toString() }
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
        recipientEmail: 'test@test.gov.uk',
        recipientName: 'test',
        requesterEmail: 'test@test.gov.uk',
        requesterName: 'test',
        dateTo: '2022-09-06',
        identifierType: 'eventId',
        dateFrom: '2022-09-06',
        zendeskId: '12',
        eventIds: ['234gh24', '98h98bc'],
        piiTypes: ['passport_number']
      })

      expect(result.checkGlacierStatusCount).toBeUndefined()
      expect(result.checkCopyStatusCount).toBeUndefined()
    })

    test('parses checkGlacierStatusCount if set', async () => {
      const checkGlacierStatusCount = 1
      givenDatabaseReturnsData({ checkGlacierStatusCount })

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.checkGlacierStatusCount).toEqual(checkGlacierStatusCount)
      expect(result.checkCopyStatusCount).toBeUndefined()
    })

    test('parses checkGlacierStatusCount if set', async () => {
      const checkCopyStatusCount = 1
      givenDatabaseReturnsData({ checkCopyStatusCount })

      const result = await getDatabaseEntryByZendeskId('12')
      expect(result.checkCopyStatusCount).toEqual(checkCopyStatusCount)
      expect(result.checkGlacierStatusCount).toBeUndefined()
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
      dynamoMock.on(GetItemCommand).resolves(undefined)

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

    it('should call the send function with the correct parameters', async () => {
      givenDatabaseReturnsData({ athenaQueryId: TEST_ATHENA_QUERY_ID })

      const result = await getQueryByAthenaQueryId(TEST_ATHENA_QUERY_ID)

      expect(dynamoMock).toHaveReceivedCommandWith(QueryCommand, testParams)
      expect(result.requestInfo).toEqual({
        recipientEmail: 'test@test.gov.uk',
        recipientName: 'test',
        requesterEmail: 'test@test.gov.uk',
        requesterName: 'test',
        dateTo: '2022-09-06',
        identifierType: 'eventId',
        dateFrom: '2022-09-06',
        zendeskId: '12',
        eventIds: ['234gh24', '98h98bc'],
        piiTypes: ['passport_number']
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
      dynamoMock.on(QueryCommand).resolves(undefined)

      expect(getQueryByAthenaQueryId(TEST_ATHENA_QUERY_ID)).rejects.toThrow(
        `No data returned from db for athenaQueryId: ${TEST_ATHENA_QUERY_ID}`
      )
      expect(dynamoMock).toHaveReceivedCommandWith(QueryCommand, testParams)
    })
  })
})
