import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  GetItemOutput
} from '@aws-sdk/client-dynamodb'
import { getDatabaseEntryByZendeskId } from './dynamoDBGet'
import { mockClient } from 'aws-sdk-client-mock'
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
    const mockDbContents = {
      Item: mockItem
    }
    dynamoMock.on(GetItemCommand).resolves(mockDbContents as GetItemOutput)
  }

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
      `Event data returned from db was not of correct type for zendesk ticket: '12'`
    )
  })
})
