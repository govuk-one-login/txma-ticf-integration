import { sendSQSMessageToCompletedQueue } from './sendSQSMessageToCompletedQueue'
import { sendSqsMessage } from '../../../src/sharedServices/queue/sendSqsMessage'
import { MOCK_QUERY_COMPLETED_QUEUE_URL } from '../../../src/utils/tests/testConstants'

jest.mock('../../../src/sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: jest.fn()
}))

const TEST_ATHENA_QUERY_ID = '46e34211-f930-4e15-a9fb-802f2ae77052'
const TEST_RECIPIENT_NAME = 'A Recipient'
const TEST_RCIPIENT_EMAIL = 'email1@test.gov.uk'
const TEST_ZENDESK_TICKET_ID = '49312752'

describe('sendSQSMessageToCompletedQueue function tests', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const TEST_QUEUE_PAYLOAD = {
    athenaQueryId: TEST_ATHENA_QUERY_ID,
    recipientName: TEST_RECIPIENT_NAME,
    recipientEmail: TEST_RCIPIENT_EMAIL,
    zendeskTicketId: TEST_ZENDESK_TICKET_ID
  }
  it('sends an sqs message containing the relevant information to the completed SQS queue', async () => {
    await sendSQSMessageToCompletedQueue(TEST_QUEUE_PAYLOAD)
    expect(sendSqsMessage).toHaveBeenCalledWith(
      TEST_QUEUE_PAYLOAD,
      MOCK_QUERY_COMPLETED_QUEUE_URL
    )
  })
})
