import { SendMessageCommand } from '@aws-sdk/client-sqs'
import { sqsClient } from './awsClients'

export const addMessageToQueue = async (message: any, queueURL: string) => {
  const queueMessageParams = {
    MessageBody: message,
    QueueUrl: queueURL
  }

  const response = await sqsClient.send(
    new SendMessageCommand(queueMessageParams)
  )
  expect(response.MessageId).toBeDefined()
}
