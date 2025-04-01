import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getEnv } from '../../../common/utils/helpers'
import { logger } from '../logger'
import { createManifestFileText } from './createManifestFileText'
import { s3Client } from '../../utils/awsSdkClients'

export const writeJobManifestFileToJobBucket = async (
  sourceBucket: string,
  fileList: string[],
  manifestFileName: string
): Promise<string> => {
  logger.info('Writing job manifest file', {
    manifestFileName: manifestFileName
  })
  const response = await s3Client.send(
    new PutObjectCommand({
      Key: manifestFileName,
      Bucket: getEnv('BATCH_JOB_MANIFEST_BUCKET_NAME'),
      Body: createManifestFileText(sourceBucket, fileList)
    })
  )
  logger.info('Succesfully wrote manifest to S3', {
    manifestFileName,
    etag: response.ETag
  })
  return response.ETag as string
}
