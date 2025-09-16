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
  beforeEach(() => {
    s3ControlClientMock.reset()
  })

  it('correct parameters passed to describe batch job', async () => {
    s3ControlClientMock.on(DescribeJobCommand).resolves(describeJobResult)

    const result = await describeBatchJob(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )

    expect(s3ControlClientMock).toHaveReceivedCommandWith(DescribeJobCommand, {
      AccountId: TEST_AWS_ACCOUNT_ID,
      JobId: TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    })

    expect(result).toEqual(testGivenJob)
  })

  it('throws error when Job is not in response', async () => {
    s3ControlClientMock.on(DescribeJobCommand).resolves({
      $metadata: {},
      Job: undefined
    })

    await expect(
      describeBatchJob(TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID)
    ).rejects.toThrow('Job not set in describe job command result')
  })
})
