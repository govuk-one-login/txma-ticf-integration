import { logger } from '../../../common/sharedServices/logger'
import { sendSqsMessage } from '../../../common/sharedServices/queue/sendSqsMessage'
import { getEnv } from '../../../common/utils/helpers'
export const sendQueryCompleteQueueMessage = async (parameters: {
  athenaQueryId: string
  recipientEmail: string
  recipientName: string
  zendeskTicketId: string
}) => {
  logger.info('sending query complete message')
  const messageId = await sendSqsMessage(
    parameters,
    getEnv('QUERY_COMPLETED_QUEUE_URL')
  )
  logger.info('Sent query complete message', { messageId })
}
