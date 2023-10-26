import { copyManualRequestData } from './copyManualRequestData'
import { sendSQSMessageToCompletedQueue } from './sendSQSMessageToCompletedQueue'

type options = {
  environment: string
  athenaQueryId: string
  zendeskId: string
  recipientName: string
  recipientEmail: string
}

export const sendAuditDataAction = async (options: options) => {
  copyManualRequestData(options.environment, options.athenaQueryId)
    .then(() =>
      console.log(
        'Successfully copied data to automated queries folder, within Athena output bucket'
      )
    )
    .catch((error: unknown) => {
      console.error('Failed to copy data within output bucket', error)
      process.exit(1)
    })

  const sqsMessage = {
    athenaQueryId: options.athenaQueryId,
    zendeskTicketId: options.zendeskId,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail
  }

  sendSQSMessageToCompletedQueue(options.environment, sqsMessage)
    .then(() => console.log('Sent SQS payload to query completed queue'))
    .catch((error: unknown) => {
      console.error('Failed to send payload to query completed queue', error)
      process.exit(1)
    })
}
