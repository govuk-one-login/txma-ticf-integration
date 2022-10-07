export const incrementPollingRetryCount = async (parameters: {
  glacierRestoreStillInProgress: boolean
  copyJobStillInProgress: boolean
}) => {
  console.log(
    `glacierRestoreStillInProgress: ${parameters.copyJobStillInProgress}, copyJobStillInProgress: ${parameters.copyJobStillInProgress}`
  )
}
