import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from './s3Client'

export const deleteAuditData = async (bucket: string, object: string) => {
  const input = {
    Bucket: bucket,
    Key: `firehose/${object}`
  }
  const command = new DeleteObjectCommand(input)

  return await s3Client.send(command)
}
