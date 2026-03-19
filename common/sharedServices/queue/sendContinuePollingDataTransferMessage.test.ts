import { vi, type MockedFunction } from 'vitest'
import { sendContinuePollingDataTransferMessage } from './sendContinuePollingDataTransferMessage'
import { sendSqsMessage } from './sendSqsMessage'
import {
  MOCK_INITIATE_DATA_REQUEST_QUEUE_URL,
  ZENDESK_TICKET_ID
} from '../../../common/utils/tests/testConstants'

vi.mock('./sendSqsMessage', () => ({
  sendSqsMessage: vi.fn()
}))

const mockSendSqsMessage = sendSqsMessage as MockedFunction<
  typeof sendSqsMessage
>

const MOCK_MESSAGE_ID = 'myMessageId'

describe('sendContinuePollingDataTransferMessage', () => {
  const givenSqsMessageIdReturned = () => {
    mockSendSqsMessage.mockResolvedValue(MOCK_MESSAGE_ID)
  }

  it('sends a message with the correct data', async () => {
    givenSqsMessageIdReturned()
    const delaySendInSeconds = 30
    await sendContinuePollingDataTransferMessage(
      ZENDESK_TICKET_ID,
      delaySendInSeconds
    )
    expect(mockSendSqsMessage).toHaveBeenCalledWith(
      {
        zendeskId: ZENDESK_TICKET_ID
      },
      MOCK_INITIATE_DATA_REQUEST_QUEUE_URL,
      delaySendInSeconds
    )
  })
})
