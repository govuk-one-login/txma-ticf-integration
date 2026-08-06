import { zendeskCopy } from '../../../common/constants/zendeskCopy'
import { DataRequestParams } from '../../../common/types/dataRequestParams'
import { checkS3BucketData } from '../../../common/sharedServices/s3/checkS3BucketData'
import { startGlacierRestore } from '../../../common/sharedServices/bulkJobs/startGlacierRestore'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { addNewDataRequestRecord } from '../../../common/sharedServices/dynamoDB/dynamoDBPut'
import { startTransferToAnalysisBucket } from '../../../common/sharedServices/bulkJobs/startTransferToAnalysisBucket'
import { sendContinuePollingDataTransferMessage } from '../../../common/sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../../common/sharedServices/queue/sendInitiateAthenaQueryMessage'
import { interpolateTemplate } from '../../../common/utils/interpolateTemplate'
import { logger } from '../../../common/sharedServices/logger'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
) => {
  const bucketData = await checkS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    logger.info('No data found for period, closing Zendesk ticket', {
      dates: dataRequestParams.dates
    })
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
    bucketData.standardTierLocationsToCopy.length > 0 ||
    bucketData.glacierIRTierLocationsToCopy.length > 0

  await addNewDataRequestRecord(dataRequestParams, glacierRestoreRequired)
  logger.info('Added data request to query request database')
  if (!glacierRestoreRequired && !copyFromAuditToAnalysisBucketRequired) {
    logger.info('All data available, queuing Athena query')
    await sendInitiateAthenaQueryMessage(dataRequestParams.zendeskId)
    return
  }

  if (glacierRestoreRequired) {
    await startGlacierRestore(
      bucketData.glacierTierLocationsToCopy,
      dataRequestParams.zendeskId
    )
    logger.info('Batch job started, queuing message for long poll')
    const waitTimeInSeconds = 900
    await sendContinuePollingDataTransferMessage(
      dataRequestParams.zendeskId,
      waitTimeInSeconds
    )
  } else if (copyFromAuditToAnalysisBucketRequired) {
    await startTransferToAnalysisBucket(
      bucketData.standardTierLocationsToCopy,
      bucketData.glacierIRTierLocationsToCopy,
      dataRequestParams.zendeskId
    )
  }
}
