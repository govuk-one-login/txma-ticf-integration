import { sendSqsMessage } from '../../../src/sharedServices/queue/sendSqsMessage'
import { sendManualQueryPayload } from './sendManualQueryPayload'

export const sendSQSMessageToCompletedQueue = async (
  environment: string,
  manualQueryCompleteSqsPayload: sendManualQueryPayload
): Promise<void> => {
  const queueUrl = `txma-data-analysis-${environment}-query-completed-queue`
  await sendSqsMessage(manualQueryCompleteSqsPayload, queueUrl)
}
