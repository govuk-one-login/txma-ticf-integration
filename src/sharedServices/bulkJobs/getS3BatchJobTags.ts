import { GetJobTaggingCommand, S3Tag } from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'
import { s3ControlClient } from '../../utils/awsSdkClients'

export const getS3BatchJobTags = async (
  jobId: string
): Promise<S3Tag[] | undefined> => {
  const result = await s3ControlClient.send(
    new GetJobTaggingCommand({
      AccountId: getEnv('AWS_ACCOUNT_ID'),
      JobId: jobId
    })
  )
  return result.Tags
}
