import {
  DescribeJobCommand,
  JobDescriptor,
  S3ControlClient
} from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'

export const describeBatchJob = async (
  jobId: string
): Promise<JobDescriptor> => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })

  const response = await client.send(
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
