import { ContinueDataTransferParams } from '../../types/continueDataTransferParams'
import { getEnv } from '../../utils/helpers'
import { sendSqsMessage } from './sendSqsMessage'
export const sendContinuePollingDataTransferMessage = async (
  zendeskId: string
) => {
  const message: ContinueDataTransferParams = { zendeskId }
  await sendSqsMessage(message, getEnv('INITIATE_DATA_REQUEST_QUEUE_URL'))
}
