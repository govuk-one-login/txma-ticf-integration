import { sendInitiateDataTransferMessage } from './sendInitiateDataTransferMessage'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { sendSqsMessage } from '../../sharedServices/queue/sendSqsMessage'
import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../../utils/tests/testConstants'

jest.mock('../../sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

const mockSendSqsMessage = sendSqsMessage as jest.Mock<
  Promise<string | undefined>
>

const MOCK_MESSAGE_ID = 'myMessageId'
describe('sendInitiateDataTransferMessage', () => {
  const givenSqsMessageIdReturned = () => {
    mockSendSqsMessage.mockResolvedValue(MOCK_MESSAGE_ID)
  }
  it('sends message to correct queue', async () => {
    givenSqsMessageIdReturned()

    const messageId = await sendInitiateDataTransferMessage(testDataRequest)
    expect(messageId).toEqual(MOCK_MESSAGE_ID)
    expect(mockSendSqsMessage).toHaveBeenCalledWith(
      testDataRequest,
      MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
    )
  })
})
