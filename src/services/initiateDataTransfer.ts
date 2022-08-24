import { DataRequestParams } from '../types/dataRequestParams'
import { InitiateDataTransferResult } from '../types/initiateDataTransferResult'
import { locateS3BucketData } from './locateS3BucketData'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
): Promise<InitiateDataTransferResult> => {
  const bucketData = await locateS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    return Promise.resolve({
      success: false,
      errorMessage: 'No data found for request'
    })
  }
  // TODO: add code here to initiate batch copy jobs
  return Promise.resolve({ success: true })
}
