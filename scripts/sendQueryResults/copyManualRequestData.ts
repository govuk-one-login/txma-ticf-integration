import { copyS3Object } from '../../common/sharedServices/s3/copyS3Object'
import { getBucketFileName } from './getBucketFileName'

export const copyManualRequestData = async (
  environment: string,
  athenaQueryId: string
): Promise<void> => {
  const fileName = `ticf-automated-audit-data-queries/${getBucketFileName(
    athenaQueryId
  )}`
  const outputBucketName = `txma-data-analysis-${environment}-athena-query-output-bucket`
  const sourcePath = `${outputBucketName}/manual-audit-data-queries/${getBucketFileName(
    athenaQueryId
  )}`
  await copyS3Object(fileName, sourcePath, outputBucketName)
}
