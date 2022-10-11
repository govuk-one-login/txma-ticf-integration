import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { updateQueryByZendeskId } from './dynamoDBUpdate'

const dynamoMock = mockClient(DynamoDBClient)

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
            recipientEmail: { S: 'test@test.gov.uk' },
            requesterEmail: { S: 'test@test.gov.uk' },
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

    const result = await updateQueryByZendeskId(
      '12',
      'athenaQueryId',
      'testAthenaId'
    )
    expect(result).toEqual({
      recipientName: 'test',
      dateTo: '2022-09-06',
      identifierType: 'eventId',
      dateFrom: '2022-09-06',
      zendeskId: '12',
      eventIds: ['234gh24', '98h98bc'],
      piiTypes: ['passport_number'],
      recipientEmail: 'test@test.gov.uk',
      requesterEmail: 'test@test.gov.uk',
      requesterName: 'test',
      athenaQueryId: 'testAthenaId'
    })
  })

  test('Does not find request query in database - empty object response', async () => {
    dynamoMock.on(UpdateItemCommand).resolves({} as UpdateItemOutput)

    await expect(
      updateQueryByZendeskId('12', 'athenaQueryId', 'testAthenaId')
    ).rejects.toThrow('Failed to update item in db for zendesk ticket: 12')
  })

  test('Does not find request query in database - undefined response', async () => {
    dynamoMock.on(UpdateItemCommand).resolves(undefined)

    await expect(
      updateQueryByZendeskId('12', 'athenaQueryId', 'testAthenaId')
    ).rejects.toThrow('Failed to update item in db for zendesk ticket: 12')
  })

  test('Finds Request query but cant turn updated info into valid updated query', async () => {
    const mockDbContents = {
      Attributes: {
        requestInfo: {
          M: {
            notAValue: { S: 'fake' }
          },
          zendeskId: { S: '12' },
          athenaQueryId: { S: 'testAthenaId' }
        }
      }
    }

    dynamoMock.on(UpdateItemCommand).resolves(mockDbContents)

    await expect(
      updateQueryByZendeskId('12', 'athenaQueryId', 'testAthenaId')
    ).rejects.toThrow(
      'Event data returned from db following update was not of correct type for zendesk ticket: 12'
    )
  })
})
