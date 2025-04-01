import { GetObjectCommand } from '@aws-sdk/client-s3'
import consumers from 'stream/consumers'
import { Readable } from 'stream'
import { s3Client } from '../../utils/awsSdkClients'

export const readS3DataToString = async (
  bucketName: string,
  fileKey: string
): Promise<string> => {
  const commandInput = {
    Bucket: bucketName,
    Key: fileKey
  }
  const { Body } = await s3Client.send(new GetObjectCommand(commandInput))

  return consumers.text(Body as Readable)
}
