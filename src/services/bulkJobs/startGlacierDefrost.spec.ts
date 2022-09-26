// import { mockClient } from 'aws-sdk-client-mock'
// import { startGlacierDefrost } from './startGlacierDefrost'
// import { S3ControlClient, CreateJobCommand } from '@aws-sdk/client-s3-control'
// import { TICKET_ID } from '../../utils/tests/testConstants'
// const s3ControlClientMock = mockClient(S3ControlClient)
// const testJobId = 'myDefrostJobId'

// describe('startGlacierDefrost', () => {
//   it('should write the manifest and start the glacier restore if a file list is supplied', async () => {
//     s3ControlClientMock.on(CreateJobCommand).resolves({ JobId: testJobId })
//     const fileList = ['myFile1', 'myFile2']
//     await startGlacierDefrost(fileList, TICKET_ID)
//     expect(s3ControlClientMock).toHaveReceivedCommandWith(CreateJobCommand, {
//       Manifest: {
//         Spec: {
//           Format: 'S3BatchOperations_CSV_20180820'
//         },
//         Location: {
//           ObjectArn: '',
//           ETag: ''
//         }
//       }
//     })
//   })
// })
