import { DataRequestParams } from '../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../types/s3BucketDataLocationResult'

export const locateS3BucketData = async (
  dataRequestParams: DataRequestParams
): Promise<S3BucketDataLocationResult> => {
  console.log('Looking for S3 data using params', dataRequestParams)
  // TODO: fill in logic to search S3 bucket for data.
  // For now we keep things in such a way that the webhook will still return a successful result
  return Promise.resolve({
    standardTierLocations: ['myLocation1'],
    glacierTierLocations: ['myGlacierLocation2'],
    dataAvailable: true
  })
}
