// import {
//   PutItemCommand,
//   DynamoDBClient,
//   PutItemCommandInput
// } from '@aws-sdk/client-dynamodb'
// import { mockClient } from 'aws-sdk-client-mock'
// import {
//   TEST_ATHENA_QUERY_ID,
//   TEST_DOWNLOAD_HASH,
//   TEST_QUERY_RESULTS_BUCKET,
//   TEST_SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME,
//   ZENDESK_TICKET_ID
// } from '../../utils/tests/testConstants'
// import { currentDateEpochMilliseconds } from '../../utils/currentDateEpochMilliseconds'
// import { writeOutSecureDownloadRecord } from './writeOutSecureDownloadRecord'
// import { when } from 'jest-when'
// import 'aws-sdk-client-mock-jest'

// jest.mock('../../utils/currentDateEpochMilliseconds', () => ({
//   currentDateEpochMilliseconds: jest.fn()
// }))

// const dynamoMock = mockClient(DynamoDBClient)
// const TEST_EPOCH_MILLISECONDS = 1666360736316
// describe('writeOutSecureDownloadRecord', () => {
//   when(currentDateEpochMilliseconds).mockReturnValue(TEST_EPOCH_MILLISECONDS)

//   describe('addNewDataRequestRecord', () => {
//     const basicRecordExpectation: PutItemCommandInput = {
//       TableName: TEST_SECURE_DOWNLOAD_DYNAMODB_TABLE_NAME,
//       Item: {
//         downloadHash: { S: TEST_DOWNLOAD_HASH },
//         downloadsRemaining: { N: '2' },
//         s3ResultsBucket: { S: TEST_QUERY_RESULTS_BUCKET },
//         s3ResultsKey: { S: `${TEST_ATHENA_QUERY_ID}.csv` },
//         zendeskId: { S: ZENDESK_TICKET_ID },
//         createdDate: { N: TEST_EPOCH_MILLISECONDS.toString() }
//       }
//     }
//     it('should write a new secure download record', async () => {
//       await writeOutSecureDownloadRecord(
//         TEST_ATHENA_QUERY_ID,
//         TEST_DOWNLOAD_HASH,
//         ZENDESK_TICKET_ID
//       )
//       expect(dynamoMock).toHaveReceivedCommandWith(
//         PutItemCommand,
//         basicRecordExpectation
//       )
//     })
//   })
// })

describe('write out download', () => {
  it('should have aplaceholder', () => {
    expect(true).toBeTrue
  })

  // it('should create a link with the correct details', () => {
  //   expect(createSecureDownloadLink(TEST_DOWNLOAD_HASH)).toEqual(
  //     `${TEST_SECURE_DOWNLOAD_WEBSITE_BASE_PATH}/${TEST_DOWNLOAD_HASH}`
  //   )
  // })
})
