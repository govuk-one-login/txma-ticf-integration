import { DescribeJobCommand, JobDescriptor } from '@aws-sdk/client-s3-control'
import { s3ControlClient } from '../../utils/awsSdkClients'
import { getEnv } from '../../utils/helpers'

export const describeBatchJob = async (
  jobId: string
): Promise<JobDescriptor> => {
  const response = await s3ControlClient.send(
    new DescribeJobCommand({
      AccountId: getEnv('AWS_ACCOUNT_ID'),
      JobId: jobId
    })
  )

  if (!response.Job) {
    throw Error('Job not set in describe job command result')
  }

  return response.Job
}
