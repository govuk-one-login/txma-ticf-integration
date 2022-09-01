import { DataRequestParams } from '../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../types/s3BucketDataLocationResult'
import { listS3Objects } from './listS3Objects'
import { ANALYSIS_BUCKET_NAME, AUDIT_BUCKET_NAME } from '../utils/constants'
import { generateS3ObjectPrefixes } from './generateS3ObjectPrefixes'

export const checkS3BucketData = async (
  dataRequestParams: DataRequestParams
): Promise<S3BucketDataLocationResult> => {
  console.log('Looking for S3 data using params', dataRequestParams)

  const prefixes = generateS3ObjectPrefixes(
    dataRequestParams.dateFrom,
    dataRequestParams.dateTo
  )

  //TODO: add handling for when there is no data available for requested dates
  const requestedAuditBucketObjects = await Promise.all(
    prefixes.map(
      async (prefix) =>
        await listS3Objects({ Bucket: AUDIT_BUCKET_NAME, Prefix: prefix })
    )
  ).then((objects: string[][]) => objects.flat())

  const existingAnalysisBucketObjects = await Promise.all(
    prefixes.map(
      async (prefix) =>
        await listS3Objects({ Bucket: ANALYSIS_BUCKET_NAME, Prefix: prefix })
    )
  ).then((objects: string[][]) => objects.flat())

  console.log(
    'Objects present in analysis bucket:',
    existingAnalysisBucketObjects
  )

  const objectsToCopy = requestedAuditBucketObjects.filter(
    (object) => !existingAnalysisBucketObjects.includes(object)
  )

  console.log('Objects to copy:', objectsToCopy)

  // For now we keep things in such a way that the webhook will still return a successful result
  //TODO: Implement storage class logic - Storage tier available in listS3Objects() function, it just needs amending
  return Promise.resolve({
    standardTierLocationsToCopy: objectsToCopy,
    glacierTierLocationsToCopy: [],
    dataAvailable: true
  })
}
