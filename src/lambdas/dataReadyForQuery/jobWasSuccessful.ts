import { describeBatchJob } from '../../sharedServices/bulkJobs/describeBatchJob'
import { logger } from '../../sharedServices/logger'

export const jobWasSuccessful = async (
  jobId: string,
  status: string
): Promise<boolean> => {
  if (status === 'Failed') {
    return false
  }
  const jobDescriptionResult = await describeBatchJob(jobId)
  logger.info('Got batch job description', { jobDescriptionResult })
  return (
    !!jobDescriptionResult.Job?.ProgressSummary?.TotalNumberOfTasks &&
    jobDescriptionResult.Job?.ProgressSummary?.TotalNumberOfTasks > 0 &&
    jobDescriptionResult.Job?.ProgressSummary?.TotalNumberOfTasks ===
      jobDescriptionResult.Job?.ProgressSummary?.NumberOfTasksSucceeded
  )
}
