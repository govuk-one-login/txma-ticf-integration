import { startCopyJob } from '../../sharedServices/bulkJobs/startCopyJob'
import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'

export const checkDataTransferStatus = async (zendeskId: string) => {
  const dbEntry = await getDatabaseEntryByZendeskId(zendeskId)
  const s3BucketDataLocationResult = await checkS3BucketData(
    dbEntry.requestInfo
  )

  if (
    (dbEntry.checkGlacierStatusCount &&
      dbEntry.checkGlacierStatusCount >= 484) ||
    (dbEntry.checkCopyStatusCount && dbEntry.checkCopyStatusCount >= 484)
  ) {
    console.error('Status check count exceeded. Process terminated')
    return await terminateStatusCheckProcess(zendeskId)
  }

  const glacierRestoreStillInProgress =
    s3BucketDataLocationResult.glacierTierLocationsToCopy.length > 0
  const copyJobStarted = !!dbEntry.checkCopyStatusCount
  const copyJobStillInProgress =
    copyJobStarted &&
    s3BucketDataLocationResult.standardTierLocationsToCopy.length > 0

  if (!glacierRestoreStillInProgress && !copyJobStarted) {
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
    await sendInitiateAthenaQueryMessage(zendeskId)
  }
}

const maintainRetryState = async (
  zendeskId: string,
  glacierRestoreStillInProgress: boolean,
  copyJobStillInProgress: boolean
) => {
  const waitTimeInSeconds = glacierRestoreStillInProgress ? 900 : 30

  await sendContinuePollingDataTransferMessage(zendeskId, waitTimeInSeconds)
  await incrementPollingRetryCount({
    glacierRestoreStillInProgress,
    copyJobStillInProgress
  })
}
