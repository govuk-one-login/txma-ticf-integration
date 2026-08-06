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
    logger.error('Status check count exceeded, process terminated', {
      errorCode: 'TICF015',
      checkCount: dbEntry.checkGlacierStatusCount,
      maxRetries: MAX_GLACIER_RETRIES
    })
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
    logger.info('Glacier restore complete, starting copy job')
    await startTransferToAnalysisBucket(
      s3BucketDataLocationResult.standardTierLocationsToCopy,
      s3BucketDataLocationResult.glacierIRTierLocationsToCopy,
      zendeskId
    )
  } else {
    const numberOfChecks = dbEntry.checkGlacierStatusCount
      ? (dbEntry.checkGlacierStatusCount + 1).toString()
      : ''
    logger.info('Glacier restore still in progress, queuing retry', {
      numberOfChecks
    })
    await maintainRetryState(zendeskId)
  }
}

const maintainRetryState = async (zendeskId: string) => {
  const waitTimeInSeconds = 900

  await incrementPollingRetryCount(zendeskId)
  await sendContinuePollingDataTransferMessage(zendeskId, waitTimeInSeconds)
}
