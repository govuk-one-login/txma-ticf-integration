import {
  SQSClient,
  SendMessageRequest,
  SendMessageCommand
} from '@aws-sdk/client-sqs'
import { getEnv } from '../../utils/helpers'

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
  const client = new SQSClient({ region: getEnv('AWS_REGION') })
  const message: SendMessageRequest = {
    QueueUrl: queueUrl,
    MessageBody: messageBody
  }
  if (delaySendInSeconds) {
    message.DelaySeconds = delaySendInSeconds
  }
  const result = await client.send(new SendMessageCommand(message))
  return result.MessageId
}
