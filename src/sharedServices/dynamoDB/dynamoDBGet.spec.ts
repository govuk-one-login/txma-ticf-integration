import {
  DynamoDBClient,
  GetItemCommand,
  GetItemOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { getDatabaseEntryByZendeskId } from './dynamoDBGet'

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDBGet', () => {
  beforeEach(() => {
    dynamoMock.reset()
  })

  test('Finds valid request query in database', async () => {
    const mockDbContents = {
      Item: {
        requestInfo: {
          M: {
            resultsName: { S: 'test' },
            dateTo: { S: '2022-09-06' },
            identifierType: { S: 'eventId' },
            dateFrom: { S: '2022-09-06' },
            zendeskId: { S: '12' },
            eventIds: { L: [{ S: '234gh24' }, { S: '98h98bc' }] },
            piiTypes: { L: [{ S: 'passport_number' }] },
            resultsEmail: { S: 'test@test.gov.uk' }
          }
        },
        zendeskId: { S: '12' }
      }
    }
    dynamoMock.on(GetItemCommand).resolves(mockDbContents as GetItemOutput)

    const result = await getDatabaseEntryByZendeskId('12')
    expect(result.requestInfo).toEqual({
      resultsName: 'test',
      dateTo: '2022-09-06',
      identifierType: 'eventId',
      dateFrom: '2022-09-06',
      zendeskId: '12',
      eventIds: ['234gh24', '98h98bc'],
      piiTypes: ['passport_number'],
      resultsEmail: 'test@test.gov.uk'
    })
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
