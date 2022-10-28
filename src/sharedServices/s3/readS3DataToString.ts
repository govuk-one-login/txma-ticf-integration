import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable, Stream } from 'stream'
import { getEnv } from '../../utils/helpers'

export const readS3DataToString = async (
  bucketName: string,
  fileKey: string
): Promise<string> => {
  console.log(`reading file ${fileKey} from bucket ${bucketName}`)

  const s3Client = new S3Client({ region: getEnv('AWS_REGION') })
  const commandInput = {
    Bucket: bucketName,
    Key: fileKey
  }
  const { Body } = await s3Client.send(new GetObjectCommand(commandInput))

  if (Body instanceof Readable) {
    return await streamToString(Body)
  } else {
    throw new Error('Valid recipient list not found')
  }
}

const streamToString = async (stream: Stream): Promise<string> => {
  const chunks: Uint8Array[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}
