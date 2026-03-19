import { vi, type MockedFunction } from 'vitest'
import { sendInitiateDataTransferMessage } from './sendInitiateDataTransferMessage'
import { testDataRequest } from '../../../common/utils/tests/testDataRequest'
import { sendSqsMessage } from '../../../common/sharedServices/queue/sendSqsMessage'
import { MOCK_INITIATE_DATA_REQUEST_QUEUE_URL } from '../../../common/utils/tests/testConstants'

vi.mock('../../../common/sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: vi.fn()
}))

const mockSendSqsMessage = sendSqsMessage as MockedFunction<
  typeof sendSqsMessage
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
