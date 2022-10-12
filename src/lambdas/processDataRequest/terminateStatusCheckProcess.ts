import { sendSqsMessageWithStringBody } from '../../sharedServices/queue/sendSqsMessage'
import { getEnv } from '../../utils/helpers'

export const terminateStatusCheckProcess = async (
  zendeskId: string
): Promise<string | undefined> => {
  return sendSqsMessageWithStringBody(
    zendeskId,
    getEnv('TERMINATED_JOB_QUEUE_URL')
  )
}
