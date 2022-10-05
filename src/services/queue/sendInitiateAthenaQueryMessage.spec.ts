import { sendInitiateAthenaQueryMessage } from './sendInitiateAthenaQueryMessage'
import { sendSqsMessage } from './sendSqsMessage'
import { MOCK_INITIATE_ATHENA_QUERY_QUEUE_URL } from '../../utils/tests/testConstants'
import { testDataRequest } from '../../utils/tests/testDataRequest'

jest.mock('./sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

const mockSendSqsMessage = sendSqsMessage as jest.Mock<
  Promise<string | undefined>
>

const MOCK_MESSAGE_ID = 'myMessageId'

describe('sendInitiateAthenaQueryMessage', () => {
  const givenSqsMessageIdReturned = () => {
    mockSendSqsMessage.mockResolvedValue(MOCK_MESSAGE_ID)
  }

  it('sends message to correct queue', async () => {
    givenSqsMessageIdReturned()

    const messageId = await sendInitiateAthenaQueryMessage(testDataRequest)

    expect(messageId).toEqual(MOCK_MESSAGE_ID)
    expect(mockSendSqsMessage).toHaveBeenCalledWith(
      testDataRequest,
      MOCK_INITIATE_ATHENA_QUERY_QUEUE_URL
    )
  })
})
