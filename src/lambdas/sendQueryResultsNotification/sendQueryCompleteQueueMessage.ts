import { sendSqsMessage } from '../../sharedServices/queue/sendSqsMessage'
import { getEnv } from '../../utils/helpers'
export const sendQueryCompleteQueueMessage = async (parameters: {
  athenaQueryId: string
  recipientEmail: string
  recipientName: string
  zendeskTicketId: string
}) => {
  console.log(
    `sending query complete message for zendesk ticket id '${parameters.zendeskTicketId}'`
  )
  const messageId = await sendSqsMessage(
    parameters,
    getEnv('QUERY_COMPLETED_QUEUE_URL')
  )
  console.log(
    `Sent query complete message with id ${messageId} for Zendesk ticket id ${parameters.zendeskTicketId}`
  )
}
