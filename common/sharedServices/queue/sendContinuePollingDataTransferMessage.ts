import { ContinueDataTransferParams } from '../../../common/types/continueDataTransferParams'
import { getEnv } from '../../../common/utils/helpers'
import { logger } from '../logger'
import { sendSqsMessage } from './sendSqsMessage'
export const sendContinuePollingDataTransferMessage = async (
  zendeskId: string,
  delaySendInSeconds: number
) => {
  const message: ContinueDataTransferParams = { zendeskId }
  const messageId = await sendSqsMessage(
    message,
    getEnv('INITIATE_DATA_REQUEST_QUEUE_URL'),
    delaySendInSeconds
  )
  logger.info('Sent long polling message for data transfer', { messageId })
}
