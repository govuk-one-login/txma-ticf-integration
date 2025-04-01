import { getEnv } from '../../../common/utils/helpers'
import { logger } from '../logger'
import { sendSqsMessageWithStringBody } from './sendSqsMessage'

export const sendInitiateAthenaQueryMessage = async (
  zendeskId: string
): Promise<string | undefined> => {
  const messageId = await sendSqsMessageWithStringBody(
    zendeskId,
    getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
  )
  logger.info('Sent message to initiate Athena query queue', { messageId })
  return messageId
}
