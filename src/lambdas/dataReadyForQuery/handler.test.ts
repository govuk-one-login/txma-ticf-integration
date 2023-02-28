import { getS3BatchJobTags } from '../../sharedServices/bulkJobs/getS3BatchJobTags'
import { jobWasSuccessful } from './jobWasSuccessful'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { batchJobStatusChangeEvent } from '../../utils/tests/events/batchJobStatusChangeEvent'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { mockLambdaContext } from '../../utils/tests/mocks/mockLambdaContext'
import { handler } from './handler'
import { when } from 'jest-when'
import {
  TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { logger } from '../../sharedServices/logger'

jest.mock('../../sharedServices/bulkJobs/getS3BatchJobTags', () => ({
  getS3BatchJobTags: jest.fn()
}))

jest.mock('../../sharedServices/queue/sendInitiateAthenaQueryMessage', () => ({
  sendInitiateAthenaQueryMessage: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

jest.mock('./jobWasSuccessful', () => ({
  jobWasSuccessful: jest.fn()
}))

const TRANSFER_TO_ANALYSIS_BUCKET_JOB_TAG_NAME = 'isTransferToAnalysisBucketJob'
const ZENDESK_ID_TAG_NAME = 'zendeskId'

describe('dataReadyForQuery', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(logger, 'error')
  })

  const givenS3BatchJobTagsContainsZendeskId = () => {
    when(getS3BatchJobTags).mockResolvedValue([
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
    when(jobWasSuccessful).mockResolvedValue(true)
  }

  const givenJobWasNotSuccessful = () => {
    when(jobWasSuccessful).mockResolvedValue(false)
  }

  it('Initiates athena query if batch job has completed successfully', async () => {
    givenS3BatchJobTagsContainsZendeskId()
    givenJobWasSuccessful()
    await handler(batchJobStatusChangeEvent('Complete'), mockLambdaContext)

    expect(getS3BatchJobTags).toBeCalledWith(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )

    expect(sendInitiateAthenaQueryMessage).toBeCalledWith(ZENDESK_TICKET_ID)
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
      `Transfer to analysis bucket job failed for zendesk ID '${ZENDESK_TICKET_ID}', jobID '${TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID}'. Please check the job report and lambda logs for details of what went wrong`
    )
  })

  it('Disregards if batch job status is not correct', async () => {
    givenS3BatchJobTagsContainsZendeskId()
    await handler(batchJobStatusChangeEvent('Test'), mockLambdaContext)

    expect(getS3BatchJobTags).not.toBeCalled()

    expect(sendInitiateAthenaQueryMessage).not.toBeCalled()
  })

  it.each`
    testCase     | tags
    ${'Incorrect Job tag'} | ${[{
    Key: 'Random tag',
    Value: 'true'
  }, {
    Key: ZENDESK_ID_TAG_NAME,
    Value: ZENDESK_TICKET_ID
  }]}
    ${'missing zendesk ID'} | ${[{
    Key: TRANSFER_TO_ANALYSIS_BUCKET_JOB_TAG_NAME,
    Value: 'true'
  }, {
    Key: 'random tag',
    Value: 'random value'
  }]}
    ${'no tags'} | ${[]}
    ${'missing zendesk ID and incorrect job tag'} | ${[{
    Key: 'random tag',
    Value: 'true'
  }]}
  `('disregards when $testCase', async ({ tags }) => {
    when(getS3BatchJobTags).mockResolvedValue(tags)

    await handler(batchJobStatusChangeEvent('Complete'), mockLambdaContext)

    expect(getS3BatchJobTags).toBeCalledWith(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )
    expect(sendInitiateAthenaQueryMessage).not.toBeCalled()
  })
})
