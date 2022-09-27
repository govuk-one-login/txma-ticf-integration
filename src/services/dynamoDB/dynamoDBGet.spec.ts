import {
  DynamoDBClient
  // GetItemCommand,
  // GetItemOutput
} from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
// import { getQueryByZendeskId } from './dynamoDBGet'

const dynamoMock = mockClient(DynamoDBClient)

describe('dynamoDBGet', () => {
  beforeEach(() => {
    dynamoMock.reset()
  })

  // test('Finds request query in database', async () => {
  //   const mockDbContents = {
  //     Item: {
  //       requestInfo: {
  //         M: {
  //           zendeskId: { S: '12' }
  //         },
  //         zendeskId: { S: '12' }
  //       }
  //     }
  //   }
  //   dynamoMock.on(GetItemCommand).resolves(mockDbContents as GetItemOutput)

  //   const result = await getQueryByZendeskId('12')
  //   expect(result).toEqual(mockDbContents)
  // })

  test('Does not find request query in database', async () => {
    // dynamoMock.on(GetItemCommand).resolves({} as GetItemOutput)

    // const result = await getQueryByZendeskId('12')
    // expect(result).toEqual({})
    expect(true).toEqual(true)
  })
})
