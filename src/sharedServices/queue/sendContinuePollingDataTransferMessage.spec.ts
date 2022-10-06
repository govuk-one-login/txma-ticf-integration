import { sendContinuePollingDataTransferMessage } from './sendContinuePollingDataTransferMessage'
import { sendSqsMessage } from './sendSqsMessage'
import {
  MOCK_INITIATE_DATA_REQUEST_QUEUE_URL,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'

jest.mock('./sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

const mockSendSqsMessage = sendSqsMessage as jest.Mock<
  Promise<string | undefined>
>

const MOCK_MESSAGE_ID = 'myMessageId'

describe('sendContinuePollingDataTransferMessage', () => {
  const givenSqsMessageIdReturned = () => {
    mockSendSqsMessage.mockResolvedValue(MOCK_MESSAGE_ID)
  }

  it('sends a message with the correct data', async () => {
    givenSqsMessageIdReturned()
    await sendContinuePollingDataTransferMessage(ZENDESK_TICKET_ID)
    expect(mockSendSqsMessage).toHaveBeenCalledWith(
      {
        zendeskId: ZENDESK_TICKET_ID
      },
      MOCK_INITIATE_DATA_REQUEST_QUEUE_URL
    )
  })
})
