import {
  GetJobTaggingCommand,
  S3ControlClient,
  S3Tag
} from '@aws-sdk/client-s3-control'
import { getEnv } from '../../utils/helpers'

export const getS3BatchJobTags = async (
  jobId: string
): Promise<S3Tag[] | undefined> => {
  const client = new S3ControlClient({ region: getEnv('AWS_REGION') })

  const result = await client.send(new GetJobTaggingCommand({ JobId: jobId }))
  return result.Tags
}
