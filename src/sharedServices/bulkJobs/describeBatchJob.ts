import {
  DescribeJobCommand,
  DescribeJobCommandOutput,
  S3ControlClient
} from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'

export const describeBatchJob = (
  jobId: string
): Promise<DescribeJobCommandOutput> => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })

  return client.send(
    new DescribeJobCommand({
      AccountId: getEnv('AWS_ACCOUNT_ID'),
      JobId: jobId
    })
  )
}
