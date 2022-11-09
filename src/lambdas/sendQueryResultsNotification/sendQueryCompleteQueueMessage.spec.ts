import { sendQueryCompleteQueueMessage } from './sendQueryCompleteQueueMessage'
import { sendSqsMessage } from '../../sharedServices/queue/sendSqsMessage'
import {
  MOCK_QUERY_COMPLETED_QUEUE_URL,
  TEST_ATHENA_QUERY_ID,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'

jest.mock('../../sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

describe('sendQueryCompletedQueueMessage', () => {
  it('should send query completed message to correct queue', async () => {
    await sendQueryCompleteQueueMessage({
      athenaQueryId: TEST_ATHENA_QUERY_ID,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME,
      zendeskTicketId: ZENDESK_TICKET_ID
    })
    expect(sendSqsMessage).toHaveBeenCalledWith(
      {
        athenaQueryId: TEST_ATHENA_QUERY_ID,
        recipientEmail: TEST_RECIPIENT_EMAIL,
        recipientName: TEST_RECIPIENT_NAME,
        zendeskTicketId: ZENDESK_TICKET_ID
      },
      MOCK_QUERY_COMPLETED_QUEUE_URL
    )
  })
})
