import {
  // getDbEntryByZendeskId,
  getQueryByZendeskId
} from '../../sharedServices/dynamoDB/dynamoDBGet'
import { sendContinuePollingDataTransferMessage } from '../../sharedServices/queue/sendContinuePollingDataTransferMessage'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'

export const checkDataTransferStatus = async (zendeskId: string) => {
  // const dbEntry = await getDbEntryByZendeskId(zendeskId)

  const s3BucketDataLocationResult = await checkS3BucketData(
    await getQueryByZendeskId(zendeskId)
  )

  const glacierRestoreStillInProgress =
    s3BucketDataLocationResult.glacierTierLocationsToCopy.length > 0

  // TODO: start copy if glacier restore finished and this is required
  const copyJobStillInProgress =
    s3BucketDataLocationResult.standardTierLocationsToCopy.length > 0

  // TODO: increment retry counts
  if (glacierRestoreStillInProgress || copyJobStillInProgress) {
    await sendContinuePollingDataTransferMessage(zendeskId)
  } else if (!glacierRestoreStillInProgress && !copyJobStillInProgress) {
    await sendInitiateAthenaQueryMessage(zendeskId)
  }
}
