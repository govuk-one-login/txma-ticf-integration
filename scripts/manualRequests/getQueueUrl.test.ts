import { mockClient } from 'aws-sdk-client-mock'
import { SQSClient, GetQueueUrlCommand } from '@aws-sdk/client-sqs'
import 'aws-sdk-client-mock-jest'
import { getQueueUrl } from './getQueueUrl'

const sqsMock = mockClient(SQSClient)
const TEST_QUEUE_NAME = 'a-test-queue'
const TEST_QUEUE_URL =
  'https://sqs.us-east-1.amazonaws.com/177715257436/aTestQueue'

describe('getQueueUrl function tests', () => {
  it('retrieves a queueUrl for a given queueName', async () => {
    sqsMock.on(GetQueueUrlCommand).resolves({ QueueUrl: TEST_QUEUE_URL })
    const queueUrl = await getQueueUrl(TEST_QUEUE_NAME)
    expect(queueUrl).toBe(TEST_QUEUE_URL)
  })
})
