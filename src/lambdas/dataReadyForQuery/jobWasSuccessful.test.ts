import { jobWasSuccessful } from './jobWasSuccessful'
import { describeBatchJob } from '../../sharedServices/bulkJobs/describeBatchJob'
import { when } from 'jest-when'
import { TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID } from '../../utils/tests/testConstants'

jest.mock('../../sharedServices/bulkJobs/describeBatchJob', () => ({
  describeBatchJob: jest.fn()
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
  when(describeBatchJob).mockResolvedValue(result)
}

describe('jobWasSuccessful', () => {
  beforeEach(() => {
    jest.resetAllMocks()
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
      expect(describeBatchJob).toBeCalledWith(
        TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
      )
      expect(result).toEqual(expected)
    }
  )
})
