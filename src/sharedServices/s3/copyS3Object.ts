import {
  S3Client,
  CopyObjectCommand,
  CopyObjectCommandInput
} from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const copyS3Object = async (
  key: string,
  copySource: string,
  bucket: string
): Promise<void> => {
  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })

  const copyCommand: CopyObjectCommandInput = {
    Key: key,
    CopySource: copySource,
    Bucket: bucket
  }
  await s3Client.send(new CopyObjectCommand(copyCommand))
}
