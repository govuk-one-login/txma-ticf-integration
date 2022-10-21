import {
  DeleteObjectCommand,
  DeleteObjectCommandInput
} from '@aws-sdk/client-s3'
import { s3Client } from './s3Client'

export const deleteAuditData = async (bucket: string, key: string) => {
  const input = {
    Bucket: bucket,
    Key: `firehose/${key}`
  } as DeleteObjectCommandInput
  const command = new DeleteObjectCommand(input)

  return await s3Client.send(command)
}
