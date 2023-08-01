import { program } from 'commander'
import { copyManualRequestData } from './manualRequests/copyManualRequestData'
import { sendSQSMessageToCompletedQueue } from './manualRequests/sendSQSMessageToCompletedQueue'

process.env.AWS_Region = 'eu-west-2'

program
  .option(
    '--athenaQueryId <path>',
    'The athenaQuery Id of the query that was ran against the audit data'
  )
  .option('--zendeskTicketId <path>', 'The zendesk Ticket Id for the request')
  .option('--recipientName <path>', 'The recipient name')
  .option('--recipientEmail <path>', 'Therecipient email')

program.parse(process.argv)

const options = program.opts()

const {
  athenaQueryId,
  zendeskTicketId,
  recipientName,
  recipientEmail
}: Record<string, string> = options
console.log(athenaQueryId)

if (!athenaQueryId || !zendeskTicketId || !recipientName || !recipientEmail) {
  console.error(
    'Invalid input parameters, please ensure all parameters are assigned a value'
  )
} else {
  copyManualRequestData(athenaQueryId).then(() =>
    console.log('Copied data within output bucket')
  )
  const sqsMessage = {
    athenaQueryId,
    zendeskTicketId,
    recipientName,
    recipientEmail
  }

  sendSQSMessageToCompletedQueue(sqsMessage).then(() =>
    console.log('Sent SQS payload to query completed queue')
  )
}

console.log(
  'Successfully sent SQS message to completed query queue, recipient will recieve email with download link'
)
