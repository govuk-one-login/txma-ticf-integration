import { incrementObjectFieldByOne } from '../../sharedServices/dynamoDB/dynamoDBUpdate'

export const incrementPollingRetryCount = async (
  zendeskId: string,
  glacierRestoreStillInProgress: boolean,
  copyJobStillInProgress: boolean
) => {
  if (
    (glacierRestoreStillInProgress && copyJobStillInProgress) ||
    (!glacierRestoreStillInProgress && !copyJobStillInProgress)
  ) {
    throw new Error(
      `Both glacierRestoreStillInProgress and copyJobStillInProgress should not be the same.
      glacierRestoreStillInProgress: ${glacierRestoreStillInProgress} | copyJobStillInProgress: ${copyJobStillInProgress}`
    )
  }

  const fieldToUpdate = glacierRestoreStillInProgress
    ? 'checkGlacierStatusCount'
    : 'checkCopyStatusCount'

  await incrementObjectFieldByOne(zendeskId, fieldToUpdate)
}
