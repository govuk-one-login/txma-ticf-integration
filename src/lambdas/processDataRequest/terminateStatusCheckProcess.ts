import { sendSqsMessageWithStringBody } from '../../../common/sharedServices/queue/sendSqsMessage'
import { getEnv } from '../../../common/utils/helpers'

export const terminateStatusCheckProcess = async (
  zendeskId: string
): Promise<string | undefined> => {
  return sendSqsMessageWithStringBody(
    zendeskId,
    getEnv('TERMINATED_JOB_QUEUE_URL')
  )
}
