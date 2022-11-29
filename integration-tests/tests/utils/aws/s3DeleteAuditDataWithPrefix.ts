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

  let objects

  try {
    const listObjectsResponse = await s3Client.send(listObjectsCommand)
    objects = listObjectsResponse.Contents

    if (!objects || objects?.length === 0) return
  } catch (error) {
    throw new Error(`Failed to list objects in bucket ${bucket}\n${error}`)
  }

  const deleteObjectsInput = {
    Bucket: bucket,
    Delete: {
      Objects: []
    }
  } as DeleteObjectsCommandInput

  objects.forEach(({ Key }) => {
    deleteObjectsInput.Delete?.Objects?.push({ Key })
  })

  const deleteObjectsCommand = new DeleteObjectsCommand(deleteObjectsInput)

  try {
    return s3Client.send(deleteObjectsCommand)
  } catch (error) {
    throw new Error(`Failed to delete data in bucket ${bucket}\n${error}`)
  }
}
