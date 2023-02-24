import { describeBatchJob } from '../../sharedServices/bulkJobs/describeBatchJob'
import { logger } from '../../sharedServices/logger'

export const jobWasSuccessful = async (
  jobId: string,
  status: string
): Promise<boolean> => {
  if (status === 'Failed') {
    return false
  }
  const job = await describeBatchJob(jobId)
  logger.info('Got batch job description', { job })
  return (
    !!job.ProgressSummary?.TotalNumberOfTasks &&
    job.ProgressSummary?.TotalNumberOfTasks > 0 &&
    job.ProgressSummary?.TotalNumberOfTasks ===
      job.ProgressSummary?.NumberOfTasksSucceeded
  )
}
