import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'

export const checkDataTransferStatus = async (zendeskId: string) => {
  const dbEntry = await getDatabaseEntryByZendeskId(zendeskId)

  console.log(dbEntry)
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

  // TODO: start copy if glacier restore finished and this is required
  const copyJobStillInProgress =
    s3BucketDataLocationResult.standardTierLocationsToCopy.length > 0

  if (glacierRestoreStillInProgress || copyJobStillInProgress) {
    await sendContinuePollingDataTransferMessage(zendeskId)
    await incrementPollingRetryCount({
      glacierRestoreStillInProgress,
      copyJobStillInProgress
    })
  } else if (!glacierRestoreStillInProgress && !copyJobStillInProgress) {
    await sendInitiateAthenaQueryMessage(zendeskId)
  }
}
