import { CopyObjectCommand, CopyObjectCommandInput } from '@aws-sdk/client-s3'
import { s3Client } from '../../utils/awsSdkClients'

export const copyS3Object = async (
  key: string,
  copySource: string,
  bucket: string
): Promise<void> => {
  const copyCommand: CopyObjectCommandInput = {
    Key: key,
    CopySource: copySource,
    Bucket: bucket
  }
  await s3Client.send(new CopyObjectCommand(copyCommand))
}
