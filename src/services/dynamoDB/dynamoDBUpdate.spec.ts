// import {
//   DynamoDBClient,
//   UpdateItemCommand
// } from '@aws-sdk/client-dynamodb'
// import { mockClient } from 'aws-sdk-client-mock'
// import { updateQueryByZendeskId } from './dynamoDBUpdate'

// const dynamoMock = mockClient(DynamoDBClient)

// describe('dynamoDBUpdate', () => {
//   beforeEach(() => {
//     dynamoMock.reset()
//   })

//   test('Updates a request query in database', async () => {
//     const mockDbContents = {
//       Item: {
//         requestInfo: {
//           M: {
//             resultsName: { S: 'test' },
//             dateTo: { S: '2022-09-06' },
//             identifierType: { S: 'eventId' },
//             dateFrom: { S: '2022-09-06' },
//             zendeskId: { S: '12' },
//             eventIds: { L: [{ S: '234gh24' }, { S: '98h98bc' }] },
//             piiTypes: { L: [{ S: 'passport_number' }] },
//             resultsEmail: { S: 'test@test.gov.uk' }
//           }
//         },
//         zendeskId: { S: '12' }
//       }
//     }
//     dynamoMock.on(UpdateItemCommand).resolves(mockDbContents as GetItemOutput)

//     const result = await getQueryByZendeskId('12')
//     expect(result).toEqual({
//       resultsName: 'test',
//       dateTo: '2022-09-06',
//       identifierType: 'eventId',
//       dateFrom: '2022-09-06',
//       zendeskId: '12',
//       eventIds: ['234gh24', '98h98bc'],
//       piiTypes: ['passport_number'],
//       resultsEmail: 'test@test.gov.uk'
//     })
//   })
// })
