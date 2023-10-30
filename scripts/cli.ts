import { Argument, program } from '@commander-js/extra-typings'
import { sendAuditDataAction } from './manualAuditDataRequests/sendResults/sendAuditDataAction'
import { AWS_REGION } from './utils/constants'

process.env.AWS_REGION = AWS_REGION

program
  .name('ticf-integration-cli')
  .description('cli tool for all helper scripts in txma ticf integration')

program
  .command('send-audit-data')
  .description(
    'Uses SAL to send the output of a raw audit request to users via email'
  )
  .addArgument(
    new Argument(
      'environment',
      'the AWS environment to run the tool in'
    ).choices(['dev', 'build', 'staging', 'integration', 'production'])
  )
  .argument(
    'athenaQueryId',
    'The athena query Id of the query that was ran against the audit data'
  )
  .argument('zendeskId', 'The Zendesk ticket id for the request')
  .argument('recipientName', 'The recipient name as it appears on zendesk')
  .argument('recipientEmail', 'The recipient email as it appears on zendesk')
  .action(
    (environment, athenaQueryId, zendeskId, recipientName, recipientEmail) => {
      sendAuditDataAction({
        athenaQueryId: athenaQueryId,
        environment: environment,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        zendeskId: zendeskId
      }).then(() => {})
    }
  )
program.parse(process.argv)
