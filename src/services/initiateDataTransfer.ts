import { DataRequestParams } from '../types/dataRequestParams'
import { locateS3BucketData } from './locateS3BucketData'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
): Promise<boolean> => {
  const bucketData = await locateS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    return Promise.resolve(false)
  }
  // TODO: add code here to initiate batch copy jobs
  return Promise.resolve(true)
}
