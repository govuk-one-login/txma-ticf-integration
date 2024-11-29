import { SendMessageRequest, SendMessageCommand } from '@aws-sdk/client-sqs'
import { sqsClient } from '../../utils/awsSdkClients'

export const sendSqsMessage = async (
  messageBody: object,
  queueUrl: string,
  delaySendInSeconds?: number
): Promise<string | undefined> => {
  return sendSqsMessageWithStringBody(
    JSON.stringify(messageBody),
    queueUrl,
    delaySendInSeconds
  )
}

export const sendSqsMessageWithStringBody = async (
  messageBody: string,
  queueUrl: string,
  delaySendInSeconds?: number
): Promise<string | undefined> => {
  const message: SendMessageRequest = {
    QueueUrl: queueUrl,
    MessageBody: messageBody
  }
  if (delaySendInSeconds) {
    message.DelaySeconds = delaySendInSeconds
  }
  const result = await sqsClient.send(new SendMessageCommand(message))
  return result.MessageId
}
