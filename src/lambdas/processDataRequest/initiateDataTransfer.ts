import { loggingCopy } from '../../constants/loggingCopy'
import { zendeskCopy } from '../../constants/zendeskCopy'
import { DataRequestParams } from '../../types/dataRequestParams'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { startGlacierRestore } from '../../sharedServices/bulkJobs/startGlacierRestore'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { addNewDataRequestRecord } from '../../sharedServices/dynamoDB/dynamoDBPut'
import { startCopyJob } from '../../sharedServices/bulkJobs/startCopyJob'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { interpolateTemplate } from '../../utils/interpolateTemplate'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
) => {
  const bucketData = await checkS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    console.log(interpolateTemplate('noDataFound', loggingCopy))
    await updateZendeskTicketById(
      dataRequestParams.zendeskId,
      interpolateTemplate('bucketDataUnavailable', zendeskCopy),
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
    console.log('Batch job started, queuing message for long poll')
    const waitTimeInSeconds = glacierRestoreRequired ? 900 : 30
    await sendContinuePollingDataTransferMessage(
      dataRequestParams.zendeskId,
      waitTimeInSeconds
    )
  }
}
