import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput
} from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const putS3Object = async (
  bucket: string,
  fileKey: string,
  data: Buffer
): Promise<void> => {
  const client = new S3Client({ region: getEnv('AWS_REGION') })

  const input = {
    Bucket: bucket,
    Key: fileKey,
    Body: data
  } as PutObjectCommandInput

  await client.send(new PutObjectCommand(input))
}
