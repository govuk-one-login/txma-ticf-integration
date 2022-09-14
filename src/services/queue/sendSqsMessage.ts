import {
  SQSClient,
  SendMessageRequest,
  SendMessageCommand
} from '@aws-sdk/client-sqs'
import { getEnv } from '../../utils/helpers'

export const sendSqsMessage = async (messageBody: object, queueUrl: string) => {
  const client = new SQSClient({ region: getEnv('AWS_REGION') })
  const message: SendMessageRequest = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(messageBody)
  }
  const result = await client.send(new SendMessageCommand(message))
  console.log(
    `Successfully sent message to queue ${queueUrl}, with message ID: ${result.MessageId}`
  )
}
