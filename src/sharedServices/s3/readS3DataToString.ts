import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import consumers from 'stream/consumers'
import { Readable } from 'stream'
import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'

export const readS3DataToString = async (
  bucketName: string,
  fileKey: string
): Promise<string> => {
  logger.info(`reading file from bucket`, {
    file: fileKey,
    bucket: bucketName
  })

  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })
  const commandInput = {
    Bucket: bucketName,
    Key: fileKey
  }
  const { Body } = await s3Client.send(new GetObjectCommand(commandInput))

  return consumers.text(Body as Readable)
}
