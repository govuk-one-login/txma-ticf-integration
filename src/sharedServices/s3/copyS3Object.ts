import {
  S3Client,
  CopyObjectCommand,
  CopyObjectCommandInput
} from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const copyS3Object = async (
  key: string,
  CopySource: string,
  Bucket: string
): Promise<void> => {
  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })

  const copyCommand: CopyObjectCommandInput = {
    Key: key,
    CopySource: CopySource,
    Bucket: Bucket
  }
  // console.log(copyCommand)
  await s3Client.send(new CopyObjectCommand(copyCommand))
}
