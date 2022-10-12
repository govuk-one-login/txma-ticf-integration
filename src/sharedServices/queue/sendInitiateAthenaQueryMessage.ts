import { getEnv } from '../../utils/helpers'
import { sendSqsMessageWithStringBody } from './sendSqsMessage'

export const sendInitiateAthenaQueryMessage = (
  zendeskId: string
): Promise<string | undefined> => {
  return sendSqsMessageWithStringBody(
    zendeskId,
    getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
  )
}
