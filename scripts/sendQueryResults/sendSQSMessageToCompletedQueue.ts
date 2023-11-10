import { sendSqsMessage } from '../../src/sharedServices/queue/sendSqsMessage'
import { SendManualQueryPayload } from '../types/sendManualQueryPayload'

export const sendSQSMessageToCompletedQueue = async (
  environment: string,
  manualQueryCompleteSqsPayload: SendManualQueryPayload
): Promise<void> => {
  const queueUrl = `txma-data-analysis-${environment}-query-completed-queue`
  await sendSqsMessage(manualQueryCompleteSqsPayload, queueUrl)
}
