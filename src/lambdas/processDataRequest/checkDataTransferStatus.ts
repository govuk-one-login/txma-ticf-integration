import { startTransferToAnalysisBucket } from '../../sharedServices/bulkJobs/startTransferToAnalysisBucket'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import {
  MAX_AUDIT_TO_ANALYSIS_COPY_RETRIES,
  MAX_GLACIER_RETRIES
} from '../../constants/configurationConstants'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'
import { logger } from '../../sharedServices/logger'

export const checkDataTransferStatus = async (zendeskId: string) => {
  const dbEntry = await getDatabaseEntryByZendeskId(zendeskId)
  const s3BucketDataLocationResult = await checkS3BucketData(
    dbEntry.requestInfo
  )
  if (
    (dbEntry.checkGlacierStatusCount &&
      dbEntry.checkGlacierStatusCount >= MAX_GLACIER_RETRIES) ||
    (dbEntry.checkCopyStatusCount &&
      dbEntry.checkCopyStatusCount >= MAX_AUDIT_TO_ANALYSIS_COPY_RETRIES)
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
  const copyJobStarted = dbEntry.checkCopyStatusCount !== undefined
  const copyJobStillInProgress =
    copyJobStarted &&
    s3BucketDataLocationResult.standardTierLocationsToCopy.length > 0

  if (!glacierRestoreStillInProgress && !copyJobStarted) {
    logger.info('Glacier restore complete. Starting copy job')
    await startTransferToAnalysisBucket(
      s3BucketDataLocationResult.standardTierLocationsToCopy,
      zendeskId
    )
    await maintainRetryState(
      zendeskId,
      glacierRestoreStillInProgress,
      copyJobStillInProgress
    )
  } else if (glacierRestoreStillInProgress || copyJobStillInProgress) {
    logger.info('Placing zendeskId back on InitiateDataRequestQueue', {
      glacier_progress: `${
        glacierRestoreStillInProgress ? 'Glacier restore' : 'Copy job'
      } still in progress`,
      number_of_checks: `${
        copyJobStillInProgress
          ? addOneToRetryCountForLogs(dbEntry.checkCopyStatusCount)
          : addOneToRetryCountForLogs(dbEntry.checkGlacierStatusCount)
      }`
    })

    await maintainRetryState(
      zendeskId,
      glacierRestoreStillInProgress,
      copyJobStillInProgress
    )
  } else if (
    copyJobStarted &&
    !copyJobStillInProgress &&
    !glacierRestoreStillInProgress
  ) {
    logger.info(
      `Restore/copy process complete. Placing zendeskId '${zendeskId}' on InitiateAthenaQueryQueue`
    )
    await sendInitiateAthenaQueryMessage(zendeskId)
  }
}

const maintainRetryState = async (
  zendeskId: string,
  glacierRestoreStillInProgress: boolean,
  copyJobStillInProgress: boolean
) => {
  const waitTimeInSeconds = glacierRestoreStillInProgress ? 900 : 30

  await incrementPollingRetryCount(
    zendeskId,
    glacierRestoreStillInProgress,
    copyJobStillInProgress
  )
  await sendContinuePollingDataTransferMessage(zendeskId, waitTimeInSeconds)
}

const addOneToRetryCountForLogs = (checkCount: number | undefined) => {
  if (!checkCount) return ''
  return ++checkCount
}
