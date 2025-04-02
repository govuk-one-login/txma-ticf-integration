import { sendSqsMessage } from '../../common/sharedServices/queue/sendSqsMessage'
import { SendManualQueryPayload } from '../types/sendManualQueryPayload'
import { getEnv } from '../../common/utils/helpers'
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs'

export const sendSQSMessageToCompletedQueue = async (
  environment: string,
  manualQueryCompleteSqsPayload: SendManualQueryPayload
): Promise<void> => {
  const queueUrl = await getCompletedQueueUrl(environment)
  await sendSqsMessage(manualQueryCompleteSqsPayload, queueUrl)
}

const getCompletedQueueUrl = async (environment: string): Promise<string> => {
  const client = new SQSClient({ region: getEnv('AWS_REGION') })
  const queueName = `txma-data-analysis-${environment}-query-completed-queue`
  const queueUrlResponse = await client.send(
    new GetQueueUrlCommand({ QueueName: queueName })
  )
  if (queueUrlResponse.QueueUrl === undefined) {
    throw new Error('QueueUrl was undefined')
  }
  return queueUrlResponse.QueueUrl
}
