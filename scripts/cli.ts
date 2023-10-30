import { program } from '@commander-js/extra-typings'
import { AWS_REGION } from './utils/constants'

process.env.AWS_REGION = AWS_REGION

program
  .name('ticf-integration-cli')
  .description('cli tool for txma ticf integration')

program
  .command('send-audit-data')
  .description('Uses SAL to send output of athena query to users via email')
  // .addOption(
  //   new Option(
  //     '-e, --environment <env>',
  //     'The environment to run the script in'
  //   )
  //     .choices(['dev', 'build', 'staging', 'integration', 'production'])
  //     .makeOptionMandatory()
  // )
  .argument(
    '--athenaQueryId <id>',
    'The athenaQuery Id of the query that was ran against the audit data'
  )
  .argument('--zendeskId <id>', 'The Zendesk ticket id for the request')
  // .requiredOption(
  //   '--recipientName <name>',
  //   'The recipient name as it appears on zendesk'
  // )
  // .requiredOption(
  //   '--recipientEmail <email>',
  //   'The recipient email as it appears on zendesk'
  // )
  .action((athenaQueryId, zendeskId) => {
    console.log({ athenaQueryId, zendeskId })
    // sendAuditDataAction({ ...options }).then(() => {})
  })
program.parse(process.argv)
