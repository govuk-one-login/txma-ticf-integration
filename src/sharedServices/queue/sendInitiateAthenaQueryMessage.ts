import { getEnv } from '../../utils/helpers'
import { logger } from '../logger'
import { sendSqsMessageWithStringBody } from './sendSqsMessage'

export const sendInitiateAthenaQueryMessage = (
  zendeskId: string
): Promise<string | undefined> => {
  logger.info(`Queueing athena query for zendeskId ${zendeskId}`)
  return sendSqsMessageWithStringBody(
    zendeskId,
    getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
  )
}
