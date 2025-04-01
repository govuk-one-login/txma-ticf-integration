import { startTransferToAnalysisBucket } from '../../../common/sharedServices/bulkJobs/startTransferToAnalysisBucket'
import { getDatabaseEntryByZendeskId } from '../../../common/sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../../common/sharedServices/queue/sendContinuePollingDataTransferMessage'
import { checkS3BucketData } from '../../../common/sharedServices/s3/checkS3BucketData'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { MAX_GLACIER_RETRIES } from '../../../common/constants/configurationConstants'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'
import { logger } from '../../../common/sharedServices/logger'

export const checkDataTransferStatus = async (zendeskId: string) => {
  const dbEntry = await getDatabaseEntryByZendeskId(zendeskId)
  logger.info('Retrieved request details from database')
  const s3BucketDataLocationResult = await checkS3BucketData(
    dbEntry.requestInfo
  )
  if (
    dbEntry.checkGlacierStatusCount &&
    dbEntry.checkGlacierStatusCount >= MAX_GLACIER_RETRIES
  ) {
    logger.error('Status check count exceeded. Process terminated')
    await terminateStatusCheckProcess(zendeskId)
    return await updateZendeskTicketById(
      zendeskId,
      'The data retrieval process timed out and could not be retrieved. Please try again by opening another ticket',
      'closed'
    )
  }

  const glacierRestoreStillInProgress =
    s3BucketDataLocationResult.glacierTierLocationsToCopy.length > 0

  if (!glacierRestoreStillInProgress) {
    logger.info('Glacier restore complete. Starting copy job')
    await startTransferToAnalysisBucket(
      s3BucketDataLocationResult.standardTierLocationsToCopy,
      zendeskId
    )
  } else {
    logger.info(
      'Placing zendeskId back on InitiateDataRequestQueue because Glacier restore is still in progress',
      {
        numberOfChecks: addOneToRetryCountForLogs(
          dbEntry.checkGlacierStatusCount
        )
      }
    )
    await maintainRetryState(zendeskId)
  }
}

const maintainRetryState = async (zendeskId: string) => {
  const waitTimeInSeconds = 900

  await incrementPollingRetryCount(zendeskId)
  await sendContinuePollingDataTransferMessage(zendeskId, waitTimeInSeconds)
}

const addOneToRetryCountForLogs = (checkCount: number | undefined): string => {
  if (!checkCount) return ''
  return (++checkCount).toString()
}
