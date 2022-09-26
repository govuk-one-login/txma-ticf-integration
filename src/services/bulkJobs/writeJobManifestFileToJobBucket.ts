import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput
} from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'

export const writeJobManifestFileToJobBucket = async (
  sourceBucket: string,
  fileList: string[],
  manifestFileName: string
): Promise<PutObjectCommandOutput> => {
  const client = new S3Client(getEnv('AWS_REGION'))
  const response = await client.send(
    new PutObjectCommand({
      Key: manifestFileName,
      Bucket: getEnv('BATCH_JOB_MANIFEST_BUCKET_ARN'),
      Body: createManifestFile(sourceBucket, fileList)
    })
  )

  return response
}

const createManifestFile = (sourceBucket: string, fileList: string[]) =>
  fileList
    .map((file) => createManifestFileLine(sourceBucket, file))
    .join('\r\n')

const createManifestFileLine = (sourceBucket: string, fileKey: string) =>
  `${sourceBucket},${fileKey}`
