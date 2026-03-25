import { vi } from 'vitest'
import { jobWasSuccessful } from './jobWasSuccessful'
import { describeBatchJob } from '../../../common/sharedServices/bulkJobs/describeBatchJob'
import { TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID } from '../../../common/utils/tests/testConstants'

vi.mock('../../../common/sharedServices/bulkJobs/describeBatchJob', () => ({
  describeBatchJob: vi.fn()
}))

const givenDescribeBatchJobReturns = (parameters: {
  totalNumberOfTasks: number
  numberOfTasksFailed: number
  numberOfTasksSucceeded: number
}) => {
  const result = {
    ProgressSummary: {
      TotalNumberOfTasks: parameters.totalNumberOfTasks,
      NumberOfTasksFailed: parameters.numberOfTasksFailed,
      NumberOfTasksSucceeded: parameters.numberOfTasksSucceeded
    }
  }
  vi.mocked(describeBatchJob).mockResolvedValue(result)
}

describe('jobWasSuccessful', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns false if status is failed', async () => {
    const result = await jobWasSuccessful(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
      'Failed'
    )
    expect(result).toEqual(false)
  })

  it.each`
    totalNumberOfTasks | numberOfTasksFailed | numberOfTasksSucceeded | expected
    ${10}              | ${0}                | ${10}                  | ${true}
    ${10}              | ${1}                | ${9}                   | ${false}
    ${0}               | ${0}                | ${0}                   | ${false}
  `(
    'when passed totalNumberOfTasks: $totalNumberOfTasks, numberOfTasksFailed: $numberOfTasksFailed, numberOfTasksSucceeded: $numberOfTasksSucceeded, returns $expected',
    async ({
      totalNumberOfTasks,
      numberOfTasksFailed,
      numberOfTasksSucceeded,
      expected
    }) => {
      givenDescribeBatchJobReturns({
        totalNumberOfTasks,
        numberOfTasksFailed,
        numberOfTasksSucceeded
      })

      const result = await jobWasSuccessful(
        TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
        'Complete'
      )
      expect(describeBatchJob).toHaveBeenCalledWith(
        TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
      )
      expect(result).toEqual(expected)
    }
  )
})
