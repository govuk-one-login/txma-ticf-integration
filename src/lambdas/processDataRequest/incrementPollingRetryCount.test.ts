import { incrementObjectFieldByOne } from '../../../common/sharedServices/dynamoDB/dynamoDBUpdate'
import { ZENDESK_TICKET_ID } from '../../../common/utils/tests/testConstants'
import { incrementPollingRetryCount } from './incrementPollingRetryCount'

jest.mock('../../../common/sharedServices/dynamoDB/dynamoDBUpdate', () => ({
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
