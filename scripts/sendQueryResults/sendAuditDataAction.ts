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
  try {
    await copyManualRequestData(options.environment, options.athenaQueryId)
    console.log(
      'Successfully copied data to automated queries folder, within Athena output bucket'
    )
  } catch (error: unknown) {
    const errMsg = 'Failed to copy data within output bucket'
    console.error(errMsg, error)
    throw new Error(errMsg)
  }

  const sqsMessage = {
    athenaQueryId: options.athenaQueryId,
    zendeskTicketId: options.zendeskId,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail
  }

  try {
    await sendSQSMessageToCompletedQueue(options.environment, sqsMessage)
    console.log('Sent SQS payload to query completed queue')
  } catch (error: unknown) {
    const errorMsg = 'Failed to send payload to query completed queue'
    console.error(errorMsg, error)
    throw new Error(errorMsg)
  }
}
