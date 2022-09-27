import { mockClient } from 'aws-sdk-client-mock'
import { startGlacierDefrost } from './startGlacierDefrost'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'
import { S3ControlClient, CreateJobCommand } from '@aws-sdk/client-s3-control'
import {
  TEST_AWS_ACCOUNT_ID,
  TEST_BATCH_JOB_MANIFEST_BUCKET_ARN,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { when } from 'jest-when'
jest.mock('./writeJobManifestFileToJobBucket', () => ({
  writeJobManifestFileToJobBucket: jest.fn()
}))

const s3ControlClientMock = mockClient(S3ControlClient)
const testJobId = 'myDefrostJobId'
const testEtag = 'myTestEtag'
describe('startGlacierDefrost', () => {
  it('should write the manifest and start the glacier restore if a file list is supplied', async () => {
    s3ControlClientMock.on(CreateJobCommand).resolves({ JobId: testJobId })
    when(writeJobManifestFileToJobBucket).mockResolvedValue(testEtag)
    const fileList = ['myFile1', 'myFile2']
    await startGlacierDefrost(fileList, ZENDESK_TICKET_ID)
    expect(s3ControlClientMock).toHaveReceivedCommandWith(CreateJobCommand, {
      AccountId: TEST_AWS_ACCOUNT_ID,
      Operation: {
        S3InitiateRestoreObject: {
          ExpirationInDays: 5,
          GlacierJobTier: 'Bulk'
        }
      },
      Manifest: {
        Spec: {
          Format: 'S3BatchOperations_CSV_20180820',
          Fields: ['Bucket', 'Key']
        },
        Location: {
          ObjectArn: `${TEST_BATCH_JOB_MANIFEST_BUCKET_ARN}/${`glacier-defrost-for-ticket-id-${ZENDESK_TICKET_ID}.csv`}`,
          ETag: testEtag
        }
      }
    })
  })
})
