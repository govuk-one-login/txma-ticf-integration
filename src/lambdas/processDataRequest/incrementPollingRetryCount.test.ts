import { incrementObjectFieldByOne } from '../../sharedServices/dynamoDB/dynamoDBUpdate'
import { ZENDESK_TICKET_ID } from '../../utils/tests/testConstants'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'

jest.mock('../../sharedServices/dynamoDB/dynamoDBUpdate', () => ({
  incrementObjectFieldByOne: jest.fn()
}))

describe('incrementPollingRetryCount', () => {
  it('calls incrementObjectFieldByOne with zendeskId and checkGlacierStatusCount parameters', async () => {
    await incrementPollingRetryCount(ZENDESK_TICKET_ID)

    expect(incrementObjectFieldByOne).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      'checkGlacierStatusCount'
    )
  })
})
