import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { getEnv } from '../../utils/helpers'

export const getS3ObjectAsStream = async (
  bucket: string,
  fileKey: string
): Promise<Readable> => {
  const client = new S3Client({ region: getEnv('AWS_REGION') })

  const input = {
    Bucket: bucket,
    Key: fileKey
  } as GetObjectCommandInput

  const { Body } = await client.send(new GetObjectCommand(input))

  if (!(Body instanceof Readable)) {
    throw Error('Get S3 Object command did not return stream')
  }
  return Body
}
