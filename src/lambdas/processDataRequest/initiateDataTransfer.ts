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
import { logger } from '../../sharedServices/logger'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
) => {
  const bucketData = await checkS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    logger.info(interpolateTemplate('noDataFound', loggingCopy))
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
  logger.info('storing new data request record')
  await addNewDataRequestRecord(
    dataRequestParams,
    glacierRestoreRequired,
    shouldStartCopyFromAuditBucket
  )

  if (glacierRestoreRequired) {
    logger.info(interpolateTemplate('foundGlacierLocations', loggingCopy))
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
    logger.info(interpolateTemplate('dataAvailableQueuingQuery', loggingCopy))
    await sendInitiateAthenaQueryMessage(dataRequestParams.zendeskId)
  } else {
    logger.info(interpolateTemplate('queuingMessageLongPoll', loggingCopy))
    const waitTimeInSeconds = glacierRestoreRequired ? 900 : 30
    await sendContinuePollingDataTransferMessage(
      dataRequestParams.zendeskId,
      waitTimeInSeconds
    )
  }
}
