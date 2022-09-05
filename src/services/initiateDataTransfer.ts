import { DataRequestParams } from '../types/dataRequestParams'
import { InitiateDataTransferResult } from '../types/initiateDataTransferResult'
import { checkS3BucketData } from './checkS3BucketData'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
): Promise<InitiateDataTransferResult> => {
  const bucketData = await checkS3BucketData(dataRequestParams)

  if (!bucketData.dataAvailable) {
    return Promise.resolve({
      success: false,
      errorMessage: 'No data found for request'
    })
  }
  // TODO: add code here to initiate batch copy jobs
  // 1. If there is data available but nothing to copy - trigger the athena job immediately
  // 2. If there is data available and standard tier data to copy - trigger batch copy job
  // 3. If there is data available and glacier tier data to restore - trigger glacier restore job
  // 4. If both points 2 and 3, add logic around partial copy - Both S3 jobs need to finish before triggering next lambda
  return Promise.resolve({ success: true })
}
