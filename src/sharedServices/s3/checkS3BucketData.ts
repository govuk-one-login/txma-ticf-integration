import { DataRequestParams } from '../../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../../types/s3BucketDataLocationResult'
import { listS3Files } from './listS3Files'
import { getEnv } from '../../utils/helpers'
import { generateS3ObjectPrefixes } from './generateS3ObjectPrefixes'
import { _Object } from '@aws-sdk/client-s3'

export const checkS3BucketData = async (
  dataRequestParams: DataRequestParams
): Promise<S3BucketDataLocationResult> => {
  console.log('Looking for S3 data using params', dataRequestParams)

  const prefixes = generateS3ObjectPrefixes(
    dataRequestParams.dateFrom,
    dataRequestParams.dateTo
  )

  const requestedAuditBucketObjects = await retrieveS3ObjectsForPrefixes(
    dataRequestParams,
    prefixes,
    getEnv('AUDIT_BUCKET_NAME')
  )

  const existingAnalysisBucketObjects = await retrieveS3ObjectsForPrefixes(
    dataRequestParams,
    prefixes,
    getEnv('ANALYSIS_BUCKET_NAME')
  )

  console.log(
    'Objects present in analysis bucket:',
    existingAnalysisBucketObjects
  )

  console.log('Objects present in auditBucket', requestedAuditBucketObjects)
  const objectsToCopy = requestedAuditBucketObjects.filter(
    (object) =>
      !existingAnalysisBucketObjects.map((o) => o.Key).includes(object.Key)
  )

  const standardTierLocationsToCopy = objectsToCopy
    .filter((o) => o.StorageClass === 'STANDARD')
    .map((o) => o.Key as string)

  const glacierTierLocationsToCopy = objectsToCopy
    .filter((o) => o.StorageClass === 'GLACIER')
    .map((o) => o.Key as string)

  console.log(
    `Number of standard tier files to copy was ${standardTierLocationsToCopy?.length}, glacier tier files to copy was ${glacierTierLocationsToCopy?.length}`
  )
  return Promise.resolve({
    standardTierLocationsToCopy,
    glacierTierLocationsToCopy,
    dataAvailable:
      requestedAuditBucketObjects?.length > 0 ||
      existingAnalysisBucketObjects?.length > 0
  })
}

const retrieveS3ObjectsForPrefixes = async (
  dataRequestParams: DataRequestParams,
  prefixes: string[],
  bucketName: string
): Promise<_Object[]> => {
  const rawData = await Promise.all(
    prefixes.map(
      async (prefix) =>
        await listS3Files({
          Bucket: bucketName,
          Prefix: prefix
        })
    )
  ).then((objects: _Object[][]) => objects.flat())
  if (rawData.some((o) => !o.Key)) {
    console.warn(
      `Some data in the bucket '${bucketName}' had missing keys, which have been ignored. ZendeskId: '${dataRequestParams.zendeskId}', date from '${dataRequestParams.dateFrom}', date to '${dataRequestParams.dateTo}'.`
    )
  }
  if (rawData.some((o) => !o.StorageClass)) {
    console.warn(
      `Some data in the bucket '${bucketName}' had missing storage class, and these have been ignored. ZendeskId: '${dataRequestParams.zendeskId}', date from '${dataRequestParams.dateFrom}', date to '${dataRequestParams.dateTo}'.`
    )
  }
  return rawData.filter((o) => !!o.Key && !!o.StorageClass)
}
