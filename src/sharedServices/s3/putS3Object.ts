import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3'
import { s3Client } from '../../utils/awsSdkClients'

export const putS3Object = async (
  bucket: string,
  fileKey: string,
  data: Buffer
): Promise<void> => {
  const input = {
    Bucket: bucket,
    Key: fileKey,
    Body: data
  } as PutObjectCommandInput

  await s3Client.send(new PutObjectCommand(input))
}
