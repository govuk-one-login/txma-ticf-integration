import { sendSqsMessageWithStringBody } from '../../sharedServices/queue/sendSqsMessage'
import { getEnv } from '../../utils/helpers'

export const sendInitiateAthenaQueryMessage = (
  zendeskId: string
): Promise<string | undefined> => {
  return sendSqsMessageWithStringBody(
    zendeskId,
    getEnv('INITIATE_ATHENA_QUERY_QUEUE_URL')
  )
}
