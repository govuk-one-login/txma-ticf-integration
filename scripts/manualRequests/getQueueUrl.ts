import {
  SQSClient,
  GetQueueUrlCommand,
  GetQueueUrlCommandInput
} from '@aws-sdk/client-sqs'
import { getEnv } from '../../src/utils/helpers'

export const getQueueUrl = async (
  queueName: string
): Promise<string | undefined> => {
  const client = new SQSClient({ region: getEnv('AWS_REGION') })
  const queueUrlCommand: GetQueueUrlCommandInput = {
    QueueName: queueName
  }
  const getQueueUrlResponse = await client.send(
    new GetQueueUrlCommand(queueUrlCommand)
  )
  return getQueueUrlResponse.QueueUrl
}
