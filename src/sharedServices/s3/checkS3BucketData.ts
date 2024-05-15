import { DataRequestParams } from '../../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../../types/s3BucketDataLocationResult'
import { listS3Files } from './listS3Files'
import { getEnv } from '../../utils/helpers'
import { _Object } from '@aws-sdk/client-s3'
import { logger } from '../logger'
import { generateS3ObjectPrefixesForDateList } from './generateS3ObjectPrefixesForDateList'
import { getAuditDataSourceBucketName } from './getAuditDataSourceBucketName'

export const checkS3BucketData = async (
  dataRequestParams: DataRequestParams
): Promise<S3BucketDataLocationResult> => {
  const prefixes = generateS3ObjectPrefixesForDateList(dataRequestParams.dates)

  const requestedAuditBucketObjects = await retrieveS3ObjectsForPrefixes(
    dataRequestParams,
    prefixes,
    getAuditDataSourceBucketName()
  )

  const existingAnalysisBucketObjects = await retrieveS3ObjectsForPrefixes(
    dataRequestParams,
    prefixes,
    getEnv('ANALYSIS_BUCKET_NAME')
  )

  const objectsToCopy = requestedAuditBucketObjects.filter(
    (object) =>
      !existingAnalysisBucketObjects.map((o) => o.Key).includes(object.Key)
  )

  const standardTierLocationsToCopy = objectsToCopy
    .filter(
      (o) =>
        o.StorageClass === 'STANDARD' ||
        //
        o.RestoreStatus?.IsRestoreInProgress === false
    )
    .map((o) => o.Key as string)

  const glacierTierLocationsToCopy = objectsToCopy
    .filter(
      (o) =>
        o.StorageClass === 'GLACIER' &&
        (!o.RestoreStatus || o.RestoreStatus.IsRestoreInProgress)
    )
    .map((o) => o.Key as string)

  logger.info('glacierTierLocationsToCopy', {
    glacierTierLocationsToCopy: glacierTierLocationsToCopy
  })
  logger.info(
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
          Prefix: prefix,
          OptionalObjectAttributes: ['RestoreStatus']
        })
    )
  ).then((objects: _Object[][]) => objects.flat())
  if (rawData.some((o) => !o.Key)) {
    logger.warn(
      `Some data in the bucket '${bucketName}' had missing keys, which have been ignored. ZendeskId: '${dataRequestParams.zendeskId}', dates '${dataRequestParams.dates}'.`
    )
  }
  if (rawData.some((o) => !o.StorageClass)) {
    logger.warn(
      `Some data in the bucket '${bucketName}' had missing storage class, and these have been ignored. ZendeskId: '${dataRequestParams.zendeskId}', dates '${dataRequestParams.dates}'.`
    )
  }
  return rawData.filter((o) => !!o.Key && !!o.StorageClass)
}
