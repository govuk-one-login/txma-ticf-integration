import { copyS3Object } from '../../../src/sharedServices/s3/copyS3Object'
import { getEnv } from '../../../src/utils/helpers'
import { getBucketFileName } from './getBucketFileName'

export const copyManualRequestData = async (
  athenaQueryId: string
): Promise<void> => {
  const fileName = `ticf-automated-audit-data-queries/${getBucketFileName(
    athenaQueryId
  )}`
  const outputBucketName = getEnv('ANALYSIS_BUCKET_NAME')
  const sourcePath = `${outputBucketName}/manual-audit-data-queries/${getBucketFileName(
    athenaQueryId
  )}`
  const destinationPath = `${outputBucketName}`
  await copyS3Object(fileName, sourcePath, destinationPath)
}
