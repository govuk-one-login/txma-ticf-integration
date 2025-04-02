import { describeBatchJob } from '../../../common/sharedServices/bulkJobs/describeBatchJob'

export const jobWasSuccessful = async (
  jobId: string,
  status: string
): Promise<boolean> => {
  // We found that the status could be "Completed" even
  // when all the individual tasks had failed. A status of "failed" generally
  // seems to mean that the job didn't start properly.
  if (status === 'Failed') {
    return false
  }
  // If the status isn't "Failed" we instead make sure that the total number of tasks
  // equals the number of succeeded tasks.
  const job = await describeBatchJob(jobId)
  return (
    !!job.ProgressSummary?.TotalNumberOfTasks &&
    job.ProgressSummary?.TotalNumberOfTasks > 0 &&
    job.ProgressSummary?.TotalNumberOfTasks ===
      job.ProgressSummary?.NumberOfTasksSucceeded
  )
}
