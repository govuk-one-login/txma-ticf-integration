import {
  DynamoDBClient,
  GetItemCommand,
  GetItemOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { getQueryByZendeskId } from './dynamoDBGet'

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
        athenaQueryId: { S: 'test_athena_id' }
      }
    }
    dynamoMock.on(GetItemCommand).resolves(mockDbContents as GetItemOutput)

    const result = await getQueryByZendeskId('12')
    expect(result).toEqual({
      recipientEmail: 'test@test.gov.uk',
      recipientName: 'test',
      requesterEmail: 'test@test.gov.uk',
      requesterName: 'test',
      dateTo: '2022-09-06',
      identifierType: 'eventId',
      dateFrom: '2022-09-06',
      zendeskId: '12',
      eventIds: ['234gh24', '98h98bc'],
      piiTypes: ['passport_number'],
      athenaQueryId: 'test_athena_id'
    })
  })

  test('Does not find request query in database - empty object response', async () => {
    dynamoMock.on(GetItemCommand).resolves({} as GetItemOutput)

    await expect(getQueryByZendeskId('12')).rejects.toThrow(
      'Request info not returned from db for zendesk ticket: 12'
    )
  })

  test('Does not find request query in database - undefined response', async () => {
    dynamoMock.on(GetItemCommand).resolves(undefined)

    await expect(getQueryByZendeskId('12')).rejects.toThrow(
      'Request info not returned from db for zendesk ticket: 12'
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

    await expect(getQueryByZendeskId('12')).rejects.toThrow(
      'Event data returned from db was not of correct type for zendesk ticket: 12'
    )
  })
})
