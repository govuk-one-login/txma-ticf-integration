import { program } from 'commander'
import { copyManualRequestData } from './manualAuditDataRequests/sendResults/copyManualRequestData'
import { sendSQSMessageToCompletedQueue } from './manualAuditDataRequests/sendResults/sendSQSMessageToCompletedQueue'
import { AWS_REGION } from './utils/constants'

process.env.AWS_REGION = AWS_REGION

program
  .requiredOption(
    '-e, --environment <env>',
    'The environment to run the script in. Valid options are: dev, build,, staging, integration, and production'
  )
  .requiredOption(
    '--athenaQueryId <id>',
    'The athenaQuery Id of the query that was ran against the audit data'
  )
  .requiredOption('--zendeskId <id>', 'The Zendesk ticket id for the request')
  .requiredOption('--recipientName <name>', 'The recipient name')
  .requiredOption('--recipientEmail <email>', 'The recipient email')

program.parse(process.argv)

const options = program.opts()

const {
  environment,
  athenaQueryId,
  zendeskId,
  recipientName,
  recipientEmail
}: Record<string, string> = options

if (
  (!environment &&
    !['dev', 'build', 'staging', 'integration', 'production'].includes(
      environment
    )) ||
  !athenaQueryId ||
  !zendeskId ||
  !recipientName ||
  !recipientEmail
) {
  console.error(
    'Invalid input parameters, please ensure all parameters are assigned a value'
  )
} else {
  copyManualRequestData(environment, athenaQueryId)
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
    athenaQueryId,
    zendeskTicketId: zendeskId,
    recipientName,
    recipientEmail
  }

  sendSQSMessageToCompletedQueue(environment, sqsMessage)
    .then(() => console.log('Sent SQS payload to query completed queue'))
    .catch((error: unknown) => {
      console.error('Failed to send payload to query completed queue', error)
      process.exit(1)
    })
}
