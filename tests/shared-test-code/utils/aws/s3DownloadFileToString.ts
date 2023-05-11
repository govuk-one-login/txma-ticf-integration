import { GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import consumers from 'stream/consumers'
import { s3Client } from './s3Client'

export const s3DownloadFileToString = async (
  bucketName: string,
  fileKey: string
): Promise<string> => {
  const commandInput = {
    Bucket: bucketName,
    Key: fileKey
  }
  console.log(`Trying to read file ${fileKey} in bucket ${bucketName}`)
  const { Body } = await s3Client.send(new GetObjectCommand(commandInput))
  return consumers.text(Body as Readable)
}
