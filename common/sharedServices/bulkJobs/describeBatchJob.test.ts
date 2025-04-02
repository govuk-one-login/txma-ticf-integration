import {
  DescribeJobCommand,
  DescribeJobCommandOutput,
  S3ControlClient
} from '@aws-sdk/client-s3-control'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import {
  TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
  TEST_AWS_ACCOUNT_ID
} from '../../../common/utils/tests/testConstants'
import { describeBatchJob } from './describeBatchJob'

const s3ControlClientMock = mockClient(S3ControlClient)

const testGivenJob = {}

const describeJobResult: DescribeJobCommandOutput = {
  $metadata: {},
  Job: testGivenJob
}

describe('describeBatchJob', () => {
  s3ControlClientMock.on(DescribeJobCommand).resolves(describeJobResult)

  it('correct parameters passed to describe batch job', async () => {
    const result = await describeBatchJob(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )

    expect(s3ControlClientMock).toHaveReceivedCommandWith(DescribeJobCommand, {
      AccountId: TEST_AWS_ACCOUNT_ID,
      JobId: TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    })

    expect(result).toEqual(testGivenJob)
  })
})
