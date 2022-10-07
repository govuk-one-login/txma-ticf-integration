import { getDatabaseEntryByZendeskId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'
export const checkDataTransferStatus = async (zendeskId: string) => {
  const dbEntry = await getDatabaseEntryByZendeskId(zendeskId)

  const s3BucketDataLocationResult = await checkS3BucketData(
    dbEntry.requestInfo
  )

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
