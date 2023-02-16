import { S3ControlClient, CreateJobCommand } from '@aws-sdk/client-s3-control'
import { when } from 'jest-when'
import {
  TEST_ANALYSIS_BUCKET,
  TEST_ANALYSIS_BUCKET_ARN,
  TEST_AWS_ACCOUNT_ID,
  TEST_BATCH_JOB_MANIFEST_BUCKET_ARN,
  TEST_BATCH_JOB_ROLE_ARN,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { startCopyJob } from './startCopyJob'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

jest.mock('./writeJobManifestFileToJobBucket', () => ({
  writeJobManifestFileToJobBucket: jest.fn()
}))

const s3ControlClientMock = mockClient(S3ControlClient)
const testJobId = 'myCopyJobId'
const testEtag = 'myTestEtag'

describe('startCopyJob', () => {
  it('should write the manifest and start the copy job if a file is supplied', async () => {
    s3ControlClientMock.on(CreateJobCommand).resolves({ JobId: testJobId })
    when(writeJobManifestFileToJobBucket).mockResolvedValue(testEtag)
    const fileList = ['myFile1', 'myFile2']
    await startCopyJob(fileList, ZENDESK_TICKET_ID)
    expect(s3ControlClientMock).toHaveReceivedCommandWith(CreateJobCommand, {
      ConfirmationRequired: false,
      ClientRequestToken: `copy-${ZENDESK_TICKET_ID}`,
      AccountId: TEST_AWS_ACCOUNT_ID,
      RoleArn: TEST_BATCH_JOB_ROLE_ARN,
      Priority: 1,
      Operation: {
        S3PutObjectCopy: {
          TargetResource: TEST_ANALYSIS_BUCKET_ARN
        }
      },
      Report: {
        Enabled: false
      },
      Manifest: {
        Spec: {
          Format: 'S3BatchOperations_CSV_20180820',
          Fields: ['Bucket', 'Key']
        },
        Location: {
          ObjectArn: `${TEST_BATCH_JOB_MANIFEST_BUCKET_ARN}/${TEST_ANALYSIS_BUCKET}-copy-job-for-ticket-id-${ZENDESK_TICKET_ID}.csv`,
          ETag: testEtag
        }
      }
    })
  })
})
