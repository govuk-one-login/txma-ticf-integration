import {
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { s3Client } from './s3Client'

export const deleteAuditDataWithPrefix = async (
  bucket: string,
  prefix: string
) => {
  const listObjectsInput = {
    Bucket: bucket,
    Prefix: prefix
  }
  const listObjectsCommand = new ListObjectsV2Command(listObjectsInput)
  const listObjectsResponse = await s3Client.send(listObjectsCommand)
  const objects = listObjectsResponse.Contents

  if (!objects || objects?.length === 0) return

  const deleteObjectsInput = {
    Bucket: bucket,
    Delete: {
      Objects: []
    }
  } as DeleteObjectsCommandInput

  objects.forEach(({ Key }) => {
    deleteObjectsInput.Delete?.Objects?.push({ Key })
  })

  const deleteObjectscommand = new DeleteObjectsCommand(deleteObjectsInput)
  return await s3Client.send(deleteObjectscommand)
}
