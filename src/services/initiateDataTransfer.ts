import { DataRequestParams } from '../types/dataRequestParams'
import { checkS3BucketData } from './checkS3BucketData'
import { startGlacierRestore } from './bulkJobs/startGlacierRestore'
import { updateZendeskTicketById } from './updateZendeskTicket'
import { addNewDataRequestRecord } from './dynamoDB/dynamoDBPut'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
) => {
  const bucketData = await checkS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    console.log('No data found for period, closing Zendesk ticket')
    await updateZendeskTicketById(
      dataRequestParams.zendeskId,
      'Your ticket has been closed because no data was available for the requested dates',
      'closed'
    )
    return
  }

  const glacierRestoreRequired =
    bucketData.glacierTierLocationsToCopy.length > 0
  console.log('storing new data request record')
  await addNewDataRequestRecord(
    dataRequestParams,
    glacierRestoreRequired,
    false
  )

  if (glacierRestoreRequired) {
    console.log('Found glacier tier locations to restore')
    await startGlacierRestore(
      bucketData.glacierTierLocationsToCopy,
      dataRequestParams.zendeskId
    )
  }

  // TODO: add code here to initiate batch copy jobs
  // 1. If there is data available but nothing to copy - trigger the athena job immediately
  // 2. If there is data available and standard tier data to copy - trigger batch copy job
  // 3. If there is data available and glacier tier data to restore - trigger glacier restore job
  // 4. If both points 2 and 3, add logic around partial copy - Both S3 jobs need to finish before triggering next lambda
}
