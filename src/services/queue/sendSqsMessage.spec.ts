import { mockClient } from 'aws-sdk-client-mock'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { sendSqsMessage } from './sendSqsMessage'
import { testDataRequest } from '../../utils/tests/testDataRequest'
const sqsMock = mockClient(SQSClient)

jest.mock('../../utils/helpers', () => ({
  getEnv: jest.fn()
}))

const MOCK_QUEUE_URL = 'http://my_queue_url'
describe('sendSqsMessage', () => {
  it('sends message to correct queue', async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: 'MyMessageId' })

    await sendSqsMessage(testDataRequest, MOCK_QUEUE_URL)
    expect(sqsMock).toHaveReceivedCommandWith(SendMessageCommand, {
      QueueUrl: MOCK_QUEUE_URL,
      MessageBody: JSON.stringify(testDataRequest)
    })
  })
})
