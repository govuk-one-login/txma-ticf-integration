import { sendSqsMessage } from '../../../src/sharedServices/queue/sendSqsMessage'
import { sendManualQueryPayload } from './sendManualQueryPayload'
import { getEnv } from '../../../src/utils/helpers'

export const sendSQSMessageToCompletedQueue = async (
  manualQueryCompleteSqsPayload: sendManualQueryPayload
): Promise<void> => {
  const queueUrl = getEnv('QUERY_COMPLETED_QUEUE_URL')
  await sendSqsMessage(manualQueryCompleteSqsPayload, queueUrl)
}
