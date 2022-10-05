import { getEnv } from '../../utils/helpers'
import { sendSqsMessage } from './sendSqsMessage'

export const sendInitiateAthenaQueryMessage = (
  zendeskId: string
): Promise<string | undefined> => {
  return sendSqsMessage(
    { zendeskId: zendeskId },
    getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
  )
}
