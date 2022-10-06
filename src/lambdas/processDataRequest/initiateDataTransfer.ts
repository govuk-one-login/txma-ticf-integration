import { DataRequestParams } from '../../types/dataRequestParams'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { startGlacierRestore } from '../../sharedServices/bulkJobs/startGlacierRestore'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { addNewDataRequestRecord } from '../../sharedServices/dynamoDB/dynamoDBPut'
import { startCopyJob } from '../../sharedServices/bulkJobs/startCopyJob'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'

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

  const copyFromAuditToAnalysisBucketRequired =
    bucketData.standardTierLocationsToCopy.length > 0

  const shouldStartCopyFromAuditBucket =
    copyFromAuditToAnalysisBucketRequired && !glacierRestoreRequired
  console.log('storing new data request record')
  await addNewDataRequestRecord(
    dataRequestParams,
    glacierRestoreRequired,
    shouldStartCopyFromAuditBucket
  )

  if (glacierRestoreRequired) {
    console.log('Found glacier tier locations to restore')
    await startGlacierRestore(
      bucketData.glacierTierLocationsToCopy,
      dataRequestParams.zendeskId
    )
  } else if (shouldStartCopyFromAuditBucket) {
    await startCopyJob(
      bucketData.standardTierLocationsToCopy,
      dataRequestParams.zendeskId
    )
  }

  if (!glacierRestoreRequired && !shouldStartCopyFromAuditBucket) {
    console.log('All data available, queuing Athena query')
    await sendInitiateAthenaQueryMessage(dataRequestParams.zendeskId)
  } else {
    console.log('Data copy job started, queuing message for long poll')
    await sendContinuePollingDataTransferMessage(dataRequestParams.zendeskId)
  }

  // TODO: add code here to initiate batch copy jobs
  // 1. If there is data available but nothing to copy - trigger the athena job immediately
  // 2. If there is data available and standard tier data to copy - trigger batch copy job
  // 3. If there is data available and glacier tier data to restore - trigger glacier restore job
  // 4. If both points 2 and 3, add logic around partial copy - Both S3 jobs need to finish before triggering next lambda
}
