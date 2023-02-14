import { S3ControlClient, CreateJobCommand } from '@aws-sdk/client-s3-control'
import { when } from 'jest-when'
import {
  TEST_ANALYSIS_BUCKET,
  TEST_ANALYSIS_BUCKET_ARN,
  TEST_AUDIT_BUCKET,
  TEST_AWS_ACCOUNT_ID,
  TEST_BATCH_JOB_MANIFEST_BUCKET_ARN,
  TEST_BATCH_JOB_ROLE_ARN,
  TEST_DECRYPTION_LAMBDA_ARN,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { startTransferToAnalysisBucket } from './startTransferToAnalysisBucket'
import { writeJobManifestFileToJobBucket } from './writeJobManifestFileToJobBucket'
import { getFeatureFlagValue } from '../../utils/getFeatureFlagValue'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
jest.mock('../../utils/getFeatureFlagValue', () => ({
  getFeatureFlagValue: jest.fn()
}))

jest.mock('./writeJobManifestFileToJobBucket', () => ({
  writeJobManifestFileToJobBucket: jest.fn()
}))

const s3ControlClientMock = mockClient(S3ControlClient)
const testJobId = 'myCopyJobId'
const testEtag = 'myTestEtag'

describe('startTransferToAnalysisBucket', () => {
  it.each([true, false])(
    'should write the manifest and start the copy job if a file is supplied and decrypt feature flag is set to %p',
    async (decryptFeatureFlagOn: boolean) => {
      when(getFeatureFlagValue).mockReturnValue(decryptFeatureFlagOn)
      s3ControlClientMock.on(CreateJobCommand).resolves({ JobId: testJobId })
      when(writeJobManifestFileToJobBucket).mockResolvedValue(testEtag)
      const fileList = ['myFile1', 'myFile2']

      await startTransferToAnalysisBucket(fileList, ZENDESK_TICKET_ID)

      expect(writeJobManifestFileToJobBucket).toBeCalledWith(
        TEST_AUDIT_BUCKET,
        fileList,
        `${TEST_ANALYSIS_BUCKET}-copy-job-for-ticket-id-${ZENDESK_TICKET_ID}.csv`
      )
      expect(s3ControlClientMock).toHaveReceivedCommandWith(CreateJobCommand, {
        ConfirmationRequired: false,
        ClientRequestToken: `copy-${ZENDESK_TICKET_ID}`,
        AccountId: TEST_AWS_ACCOUNT_ID,
        RoleArn: TEST_BATCH_JOB_ROLE_ARN,
        Priority: 1,
        Operation: {
          ...(!decryptFeatureFlagOn && {
            S3PutObjectCopy: {
              TargetResource: TEST_ANALYSIS_BUCKET_ARN
            }
          }),
          ...(decryptFeatureFlagOn && {
            LambdaInvoke: {
              FunctionArn: TEST_DECRYPTION_LAMBDA_ARN
            }
          })
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
    }
  )
})
