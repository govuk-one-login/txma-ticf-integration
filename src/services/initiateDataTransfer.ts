import { DataRequestParams } from '../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../types/s3BucketDataLocationResult'
import { locateS3BucketData } from './locateS3BucketData'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
): Promise<boolean> => {
  const bucketData = await locateS3BucketData(dataRequestParams)
  if (!dataFound(bucketData)) {
    return Promise.resolve(false)
  }

  return Promise.resolve(true)
}

const dataFound = (s3BucketDataLocationResult: S3BucketDataLocationResult) => {
  return (
    (s3BucketDataLocationResult.glacierTierLocations &&
      s3BucketDataLocationResult.glacierTierLocations.length) ||
    (s3BucketDataLocationResult.standardTierLocations &&
      s3BucketDataLocationResult.standardTierLocations.length)
  )
}
