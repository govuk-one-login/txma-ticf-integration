import { sendSqsMessageWithStringBody } from '../../sharedServices/queue/sendSqsMessage'
import {
  MOCK_TERMINATED_JOB_QUEUE_URL,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { terminateStatusCheckProcess } from './terminateStatusCheckProcess'

jest.mock('../../sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessageWithStringBody: jest.fn()
}))

const mockSendSqsMessageWithStringBody =
  sendSqsMessageWithStringBody as jest.Mock<Promise<string | undefined>>

const MOCK_MESSAGE_ID = 'myMessageId'

describe('terminateStatusCheckProcess', () => {
  const givenSqsMessageIdReturned = () => {
    mockSendSqsMessageWithStringBody.mockResolvedValue(MOCK_MESSAGE_ID)
  }

  it('sends a message to the correct queue to signify the process has ended', async () => {
    givenSqsMessageIdReturned()

    const messageId = await terminateStatusCheckProcess(ZENDESK_TICKET_ID)

    expect(messageId).toEqual(MOCK_MESSAGE_ID)
    expect(mockSendSqsMessageWithStringBody).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID,
      MOCK_TERMINATED_JOB_QUEUE_URL
    )
  })
})
