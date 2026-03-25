import { vi } from 'vitest'
import { sendSQSMessageToCompletedQueue } from './sendSQSMessageToCompletedQueue'
import { sendSqsMessage } from '../../common/sharedServices/queue/sendSqsMessage'
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs'
import { mockClient } from 'aws-sdk-client-mock'

vi.mock('../../src/sharedServices/queue/sendSqsMessage', () => ({
  sendSqsMessage: vi.fn()
}))

const TEST_ATHENA_QUERY_ID = '46e34211-f930-4e15-a9fb-802f2ae77052'
const TEST_RECIPIENT_NAME = 'A Recipient'
const TEST_RECIPIENT_EMAIL = 'email1@example.com'
const TEST_ZENDESK_TICKET_ID = '49312752'

const mockSQSClient = mockClient(SQSClient)

describe('sendSQSMessageToCompletedQueue function tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockSQSClient.reset()
    mockSQSClient.callsFake((input) => {
      throw new Error(`Unexpected SQS request - ${JSON.stringify(input)}`)
    })
  })

  const environment = 'test'
  const queueName = `txma-data-analysis-${environment}-query-completed-queue`
  const queueUrl = `https://sqs.eu-west-2.amazonaws.com/012345678901/${queueName}`
  const getQueueUrlError = new Error('QueueDoesNotExist')
  const payload = {
    athenaQueryId: TEST_ATHENA_QUERY_ID,
    recipientName: TEST_RECIPIENT_NAME,
    recipientEmail: TEST_RECIPIENT_EMAIL,
    zendeskTicketId: TEST_ZENDESK_TICKET_ID
  }

  it('sends an sqs message containing the relevant information to the completed SQS queue', async () => {
    mockSQSClient
      .on(GetQueueUrlCommand, { QueueName: queueName })
      .resolvesOnce({ QueueUrl: queueUrl })

    await sendSQSMessageToCompletedQueue(environment, payload)
    expect(sendSqsMessage).toHaveBeenCalledWith(payload, queueUrl)
  })

  it('cannot get the name of the completed SQS queue', async () => {
    mockSQSClient
      .on(GetQueueUrlCommand, { QueueName: queueName })
      .rejectsOnce(getQueueUrlError)

    await expect(
      sendSQSMessageToCompletedQueue(environment, payload)
    ).rejects.toThrowError(getQueueUrlError)
    expect(sendSqsMessage).not.toHaveBeenCalled()
  })
})
