import { vi } from 'vitest'
import { getS3BatchJobTags } from '../../../common/sharedServices/bulkJobs/getS3BatchJobTags'
import { jobWasSuccessful } from './jobWasSuccessful'
import { sendInitiateAthenaQueryMessage } from '../../../common/sharedServices/queue/sendInitiateAthenaQueryMessage'
import { batchJobStatusChangeEvent } from '../../../common/utils/tests/events/batchJobStatusChangeEvent'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { mockLambdaContext } from '../../../common/utils/tests/mocks/mockLambdaContext'
import { handler } from './handler'
import {
  TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
  ZENDESK_TICKET_ID
} from '../../../common/utils/tests/testConstants'
import { logger } from '../../../common/sharedServices/logger'

vi.mock('../../../common/sharedServices/bulkJobs/getS3BatchJobTags', () => ({
  getS3BatchJobTags: vi.fn()
}))

vi.mock(
  '../../../common/sharedServices/queue/sendInitiateAthenaQueryMessage',
  () => ({
    sendInitiateAthenaQueryMessage: vi.fn()
  })
)

vi.mock('../../../common/sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: vi.fn()
}))

vi.mock('./jobWasSuccessful', () => ({
  jobWasSuccessful: vi.fn()
}))

const TRANSFER_TO_ANALYSIS_BUCKET_JOB_TAG_NAME = 'isTransferToAnalysisBucketJob'
const ZENDESK_ID_TAG_NAME = 'zendeskId'

describe('dataReadyForQuery', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(logger, 'error')
  })

  const givenS3BatchJobTagsContainsZendeskId = () => {
    vi.mocked(getS3BatchJobTags).mockResolvedValue([
      {
        Key: TRANSFER_TO_ANALYSIS_BUCKET_JOB_TAG_NAME,
        Value: 'true'
      },
      {
        Key: ZENDESK_ID_TAG_NAME,
        Value: ZENDESK_TICKET_ID
      }
    ])
  }

  const givenJobWasSuccessful = () => {
    vi.mocked(jobWasSuccessful).mockResolvedValue(true)
  }

  const givenJobWasNotSuccessful = () => {
    vi.mocked(jobWasSuccessful).mockResolvedValue(false)
  }

  it('Initiates athena query if batch job has completed successfully', async () => {
    givenS3BatchJobTagsContainsZendeskId()
    givenJobWasSuccessful()
    await handler(batchJobStatusChangeEvent('Complete'), mockLambdaContext)

    expect(getS3BatchJobTags).toHaveBeenCalledWith(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )

    expect(sendInitiateAthenaQueryMessage).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
  })

  it('Closes the Zendesk ticket if the batch job has failed', async () => {
    givenS3BatchJobTagsContainsZendeskId()
    givenJobWasNotSuccessful()
    await handler(batchJobStatusChangeEvent('Failed'), mockLambdaContext)
    expect(updateZendeskTicketById).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'The data retrieval process errored and the data could not be retrieved. Please try again by opening another ticket, or contact the TxMA team to look into it for you',
      'closed'
    )
    expect(logger.error).toHaveBeenLastCalledWith(
      'Transfer to analysis bucket job failed for jobID. Please check the job report and lambda logs for details of what went wrong',
      { jobId: TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID }
    )
  })

  it('Disregards if batch job status is not correct', async () => {
    givenS3BatchJobTagsContainsZendeskId()
    await handler(batchJobStatusChangeEvent('Test'), mockLambdaContext)

    expect(getS3BatchJobTags).not.toHaveBeenCalled()

    expect(sendInitiateAthenaQueryMessage).not.toHaveBeenCalled()
  })

  it.each`
    testCase     | tags
    ${'Incorrect Job tag'} | ${[
  {
    Key: 'Random tag',
    Value: 'true'
  },
  {
    Key: ZENDESK_ID_TAG_NAME,
    Value: ZENDESK_TICKET_ID
  }
]}
    ${'missing zendesk ID'} | ${[
  {
    Key: TRANSFER_TO_ANALYSIS_BUCKET_JOB_TAG_NAME,
    Value: 'true'
  },
  {
    Key: 'random tag',
    Value: 'random value'
  }
]}
    ${'no tags'} | ${[]}
    ${'missing zendesk ID and incorrect job tag'} | ${[
  {
    Key: 'random tag',
    Value: 'true'
  }
]}
  `('disregards when $testCase', async ({ tags }) => {
    vi.mocked(getS3BatchJobTags).mockResolvedValue(tags)

    await handler(batchJobStatusChangeEvent('Complete'), mockLambdaContext)

    expect(getS3BatchJobTags).toHaveBeenCalledWith(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )
    expect(sendInitiateAthenaQueryMessage).not.toHaveBeenCalled()
  })
})
