import { startCopyJob } from '../../sharedServices/bulkJobs/startCopyJob'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'

export const checkDataTransferStatus = async (zendeskId: string) => {
  const dbEntry = await getDatabaseEntryByZendeskId(zendeskId)
  const s3BucketDataLocationResult = await checkS3BucketData(
    dbEntry.requestInfo
  )
  // add magic numbers below to a constant file
  if (
    (dbEntry.checkGlacierStatusCount &&
      dbEntry.checkGlacierStatusCount >= 484) ||
    (dbEntry.checkCopyStatusCount && dbEntry.checkCopyStatusCount >= 60)
  ) {
    console.error('Status check count exceeded. Process terminated')
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
    console.log('Glacier restore complete. Starting copy job')
    await startCopyJob(
      s3BucketDataLocationResult.standardTierLocationsToCopy,
      zendeskId
    )
    await maintainRetryState(
      zendeskId,
      glacierRestoreStillInProgress,
      copyJobStillInProgress
    )
  } else if (glacierRestoreStillInProgress || copyJobStillInProgress) {
    console.log(
      `${
        glacierRestoreStillInProgress ? 'Glacier restore' : 'Copy job'
      } still in progress.`,
      'Placing zendeskId back on InitiateDataRequestQueue.',
      `Number of checks: ${
        copyJobStillInProgress
          ? dbEntry.checkCopyStatusCount
          : dbEntry.checkGlacierStatusCount
      }`
    )
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
    console.log(
      'Restore/copy process complete. Placing zendeskId on InitiateAthenaQueryQueue'
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
