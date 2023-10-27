import { Option, program } from '@commander-js/extra-typings'
import { sendAuditDataAction } from './manualAuditDataRequests/sendResults/sendAuditDataAction'
import { AWS_REGION } from './utils/constants'

process.env.AWS_REGION = AWS_REGION

program
  .name('ticf-integration-cli')
  .description('cli tool for txma ticf integration')

program
  .command('send-audit-data')
  .description('Uses SAL to send output of athena query to users via email')
  .addOption(
    new Option(
      '-e, --environment <env>',
      'The environment to run the script in'
    )
      .choices(['dev', 'build', 'staging', 'integration', 'production'])
      .makeOptionMandatory()
  )
  .requiredOption(
    '--athenaQueryId <id>',
    'The athenaQuery Id of the query that was ran against the audit data'
  )
  .requiredOption('--zendeskId <id>', 'The Zendesk ticket id for the request')
  .requiredOption('--recipientName <name>', 'The recipient name')
  .requiredOption('--recipientEmail <email>', 'The recipient email')
  .action((options) => {
    sendAuditDataAction({ ...options }).then(() => {})
  })
program.parse(process.argv)
