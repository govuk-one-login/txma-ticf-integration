import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'
import { createManifestFileText } from './createManifestFileText'

export const writeJobManifestFileToJobBucket = async (
  sourceBucket: string,
  fileList: string[],
  manifestFileName: string
): Promise<string> => {
  const client = new S3Client(getEnv('AWS_REGION'))
  logger.info('Writing job manifest file', {
    manifestFileName: manifestFileName
  })
  const response = await client.send(
    new PutObjectCommand({
      Key: manifestFileName,
      Bucket: getEnv('BATCH_JOB_MANIFEST_BUCKET_NAME'),
      Body: createManifestFileText(sourceBucket, fileList)
    })
  )
  logger.info('wrote manifest to S3 with etag ', { etag: response.ETag })
  return response.ETag as string
}
