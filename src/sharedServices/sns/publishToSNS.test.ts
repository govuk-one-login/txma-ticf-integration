import {
  PublishCommand,
  PublishCommandOutput,
  SNSClient
} from '@aws-sdk/client-sns'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import { EMAIL_TO_SLACK_SNS_TOPIC_ARN } from '../../utils/tests/testConstants'
import { publishToSNS } from './publishToSNS'

describe('publish to SNS secrets', () => {
  const testMessageID = '12345'
  const testMessage = 'test message'
  const snsMockClient = mockClient(SNSClient)
  const snsPublishCommandOutput: PublishCommandOutput = {
    MessageId: testMessageID,
    $metadata: {}
  }

  snsMockClient.on(PublishCommand).resolves(snsPublishCommandOutput)
  it('should publish to SNS successfully', async () => {
    const response = await publishToSNS(
      EMAIL_TO_SLACK_SNS_TOPIC_ARN,
      testMessage
    )
    expect(response).toEqual(testMessageID)
    expect(snsMockClient).toHaveReceivedCommandWith(PublishCommand, {
      Message: testMessage,
      TopicArn: EMAIL_TO_SLACK_SNS_TOPIC_ARN
    })
  })
})
