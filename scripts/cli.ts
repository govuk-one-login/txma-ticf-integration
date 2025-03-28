import { Argument, Command } from '@commander-js/extra-typings'
import { initiateCopyAndDecryptAction } from './initiateCopyAndDecrypt/manualAuditDataRequestInitiateCopyAndDecryptAction'
import { sendAuditDataAction } from './sendQueryResults/sendAuditDataAction'
import { isStringArray } from './utils/lib'
import { AWS_REGION } from './utils/constants'
import { testDateArgs, testDateRangeArgs } from './utils/dateUtils'

process.env.AWS_REGION = AWS_REGION

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeHelper = new Command()

export const buildCLI = (program: typeof _typeHelper) => {
  program
    .name('ticf-integration-cli')
    .description('cli tool for any scripts for txma ticf integration')

  program
    .command('send-query-results')
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
      (
        environment,
        athenaQueryId,
        zendeskId,
        recipientName,
        recipientEmail
      ) => {
        sendAuditDataAction({
          athenaQueryId: athenaQueryId,
          environment: environment,
          recipientEmail: recipientEmail,
          recipientName: recipientName,
          zendeskId: zendeskId
          // eslint-disable-next-line @typescript-eslint/no-empty-function
        }).then(() => {})
      }
    )

  program
    .command('retrieve-audit-data')
    .description(
      'Hooks into SAL to retrieve audit data from glacier and perform double decryption of audit data so it can be queried by athena'
    )
    .argument(
      'zendeskId <id>',
      'The Zendesk ticket id for the request. The script assumes the zendesk id is not real.'
    )
    .option(
      '--dates [dates...]',
      'An array of dates of audit files to copy for analysis in the format "YYYY-MM-DD"',
      testDateArgs
    )
    .option(
      '--daterange [daterange...]',
      'An array of date ranges from earliest to latest of audit files to copy for analysis in the format "YYYY/MM/DD-YYYY/MM/DD"',
      testDateRangeArgs
    )
    .action((zendeskId, options) => {
      if (isStringArray(options.daterange) || isStringArray(options.dates)) {
        initiateCopyAndDecryptAction({
          zendeskId: zendeskId,
          daterange: options.daterange as string[],
          dates: options.dates as string[]
          // eslint-disable-next-line @typescript-eslint/no-empty-function
        }).then(() => {})
      } else {
        console.error('missing date options. Use "--help" flag for details')
        process.exit(1)
      }
    })

  return program
}

export const parseCliCallerForTesting = (cli: string[]) => {
  const program = buildCLI(new Command())
  program.commands.forEach((command) => {
    command.exitOverride()
  })
  program.parse(cli)
}

// this if statement check if this file is executed as a script vs being imported by another
// if run as script, we can then begin parsing the command line arguments
if (require.main === module) {
  const program = buildCLI(new Command())
  program.parse(process.argv)
}
