import { incrementObjectFieldByOne } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'

jest.mock('../../sharedServices/dynamoDB/dynamoDBUpdate', () => ({
  incrementObjectFieldByOne: jest.fn()
}))

const updateGlacierCounter = 'checkGlacierStatusCount'
const updateCopyCounter = 'checkCopyStatusCount'

describe('incrementPollingRetryCount', () => {
  it('calls incrementObjectFieldByOne with zendeskId and checkGlacierStatusCount parameters', async () => {
    const glacierRestoreStillInProgress = true
    const copyJobStillInProgress = false

    await incrementPollingRetryCount(
      ZENDESK_TICKET_ID,
      glacierRestoreStillInProgress,
      copyJobStillInProgress
    )

    expect(incrementObjectFieldByOne).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      updateGlacierCounter
    )
  })

  it('calls incrementObjectFieldByOne with zendeskId and checkGlacierStatusCount parameters', async () => {
    const glacierRestoreStillInProgress = false
    const copyJobStillInProgress = true

    await incrementPollingRetryCount(
      ZENDESK_TICKET_ID,
      glacierRestoreStillInProgress,
      copyJobStillInProgress
    )

    expect(incrementObjectFieldByOne).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      updateCopyCounter
    )
  })

  it('errors when both boolean values are true', async () => {
    const glacierRestoreStillInProgress = true
    const copyJobStillInProgress = true

    expect(
      incrementPollingRetryCount(
        ZENDESK_TICKET_ID,
        glacierRestoreStillInProgress,
        copyJobStillInProgress
      )
    ).rejects.toThrow(
      `Both glacierRestoreStillInProgress and copyJobStillInProgress should not be the same.
      glacierRestoreStillInProgress: ${glacierRestoreStillInProgress} | copyJobStillInProgress: ${copyJobStillInProgress}`
    )
  })

  it('errors when both boolean values are false', async () => {
    const glacierRestoreStillInProgress = false
    const copyJobStillInProgress = false

    expect(
      incrementPollingRetryCount(
        ZENDESK_TICKET_ID,
        glacierRestoreStillInProgress,
        copyJobStillInProgress
      )
    ).rejects.toThrow(
      `Both glacierRestoreStillInProgress and copyJobStillInProgress should not be the same.
      glacierRestoreStillInProgress: ${glacierRestoreStillInProgress} | copyJobStillInProgress: ${copyJobStillInProgress}`
    )
  })
})
