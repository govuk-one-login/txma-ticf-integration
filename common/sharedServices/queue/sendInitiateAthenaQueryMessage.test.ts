import { vi, type MockedFunction } from 'vitest'
import { sendInitiateAthenaQueryMessage } from './sendInitiateAthenaQueryMessage'
import { sendSqsMessageWithStringBody } from './sendSqsMessage'
import {
  MOCK_INITIATE_ATHENA_QUERY_QUEUE_URL,
  ZENDESK_TICKET_ID
} from '../../../common/utils/tests/testConstants'

vi.mock('./sendSqsMessage', () => ({
  sendSqsMessageWithStringBody: vi.fn()
}))

const mockSendSqsMessageWithStringBody =
  sendSqsMessageWithStringBody as MockedFunction<
    typeof sendSqsMessageWithStringBody
  >

const MOCK_MESSAGE_ID = 'myMessageId'

describe('sendInitiateAthenaQueryMessage', () => {
  const givenSqsMessageIdReturned = () => {
    mockSendSqsMessageWithStringBody.mockResolvedValue(MOCK_MESSAGE_ID)
  }

  it('sends message to correct queue', async () => {
    givenSqsMessageIdReturned()

    const messageId = await sendInitiateAthenaQueryMessage(ZENDESK_TICKET_ID)

    expect(messageId).toEqual(MOCK_MESSAGE_ID)
    expect(mockSendSqsMessageWithStringBody).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      MOCK_INITIATE_ATHENA_QUERY_QUEUE_URL
    )
  })
})
