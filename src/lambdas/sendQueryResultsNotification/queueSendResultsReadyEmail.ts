import { createSecureDownloadLink } from './createSecureDownloadLink'
import { sendSqsMessage } from '../../sharedServices/queue/sendSqsMessage'
import { PersonalisationOptions } from '../../types/notify/personalisationOptions'
import { getEnv } from '../../utils/helpers'
export const queueSendResultsReadyEmail = async (parameters: {
  downloadHash: string
  zendeskTicketId: string
  recipientEmail: string
  recipientName: string
}) => {
  const emailOptions: PersonalisationOptions = {
    email: parameters.recipientEmail,
    firstName: parameters.recipientName,
    zendeskId: parameters.zendeskTicketId,
    secureDownloadUrl: createSecureDownloadLink(parameters.downloadHash)
  }
  console.log(
    `Queueing email send for zendesk ticket id ${parameters.zendeskTicketId}`
  )
  await sendSqsMessage(emailOptions, getEnv('EMAIL_SEND_QUEUE_URL'))
}
