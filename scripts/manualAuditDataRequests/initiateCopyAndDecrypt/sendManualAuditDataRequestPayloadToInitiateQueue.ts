import { sendSqsMessage } from '../../../src/sharedServices/queue/sendSqsMessage'
import { getEnv } from '../../../src/utils/helpers'
import { ManualAuditDataRequestPayload } from '../../types/manualAuditDataRequestPayload'

export const sendManualAuditDataRequestPayloadToInitiateQueue = async (
  payload: ManualAuditDataRequestPayload
): Promise<void> => {
  const queueUrl = getEnv('INITIATE_DATA_REQUEST_QUEUE_URL')
  await sendSqsMessage(payload, queueUrl)
}
