import { getS3BatchJobTags } from '../../sharedServices/bulkJobs/getS3BatchJobTags'
import { sendInitiateAthenaQueryMessage } from '../../sharedServices/queue/sendInitiateAthenaQueryMessage'
import { batchJobStatusChangeEvent } from '../../utils/tests/events/batchJobStatusChangeEvent'
import { mockLambdaContext } from '../../utils/tests/mocks/mockLambdaContext'
import { handler } from './handler'
import { when } from 'jest-when'
import {
  TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'

jest.mock('../../sharedServices/bulkJobs/getS3BatchJobTags', () => ({
  getS3BatchJobTags: jest.fn()
}))

jest.mock('../../sharedServices/queue/sendInitiateAthenaQueryMessage', () => ({
  sendInitiateAthenaQueryMessage: jest.fn()
}))

const TRANSFER_TO_ANALYSIS_BUCKET_JOB_TAG_NAME = 'isTransferToAnalysisBucketJob'
const ZENDESK_ID_TAG_NAME = 'zendeskId'

describe('dataReadyForQuery', () => {
  beforeEach(() => {
    jest.resetAllMocks()
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

  it('Initiates athena query if batch job has completed', async () => {
    givenS3BatchJobTagsContainsZendeskId()
    await handler(batchJobStatusChangeEvent('Complete'), mockLambdaContext)

    expect(getS3BatchJobTags).toBeCalledWith(
      TEST_TRANSFER_TO_ANALYSIS_BUCKET_JOB_ID
    )

    expect(sendInitiateAthenaQueryMessage).toBeCalledWith(ZENDESK_TICKET_ID)
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
