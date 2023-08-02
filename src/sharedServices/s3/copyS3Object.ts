import {
  S3Client,
  CopyObjectCommand,
  CopyObjectCommandInput
} from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const copyS3Object = async (
  fileName: string,
  fileLocationPath: string,
  fileDestinationBucket: string
): Promise<void> => {
  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })

  const copyCommand: CopyObjectCommandInput = {
    Key: `${fileName}`,
    CopySource: `${fileLocationPath}/${fileName}`,
    Bucket: fileDestinationBucket
  }
  await s3Client.send(new CopyObjectCommand(copyCommand))
}
