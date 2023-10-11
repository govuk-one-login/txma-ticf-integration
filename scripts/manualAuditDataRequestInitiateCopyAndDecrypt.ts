import { program } from 'commander'
import {
  convertDaterangeToDateArray,
  isDateRangeArray
} from './manualAuditDataRequests/initiateCopyAndDecrypt/daterange'
import { generateInitiateCopyAndDecryptPayload } from './manualAuditDataRequests/initiateCopyAndDecrypt/generateInitiateCopyAndDecryptPayload'
import { isDatesArray } from './manualAuditDataRequests/initiateCopyAndDecrypt/isDatesArray'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './manualAuditDataRequests/initiateCopyAndDecrypt/sendManualAuditDataRequestPayloadToInitiateQueue'
import { AWS_REGION } from './utils/constants'

process.env.AWS_REGION = AWS_REGION

program
  .addHelpText(
    'afterAll',
    '\nNote that at least one of "dates" or "daterange" should be specified'
  )
  .requiredOption('--zendeskId <id>', 'The Zendesk ticket id for the request')
  .option(
    '--dates [dates...]',
    'An array of dates of audit files to copy for analysis in the format "YYYY-MM-DD"'
  )
  .option(
    '--daterange [daterange...]',
    'An array of date ranges from earliest to latest of audit files to copy for analysis in the format "YYYY/MM/DD-YYYY/MM/DD"'
  )

program.parse(process.argv)

const options = program.opts()
const zendeskId: string = options.zendeskId
const dates: string[] = options.dates || []
const daterange: string[] = options.daterange

if (isDateRangeArray(daterange)) {
  dates.push(...convertDaterangeToDateArray(daterange))
} else {
  console.error('invalid daterange. please check the format')
  throw new Error('Invalid Date Range')
}

if (!isDatesArray(dates) || !zendeskId) {
  console.error(
    'Invalid input parameters, please ensure all parameters are assigned the correct value'
  )
} else {
  const payload = generateInitiateCopyAndDecryptPayload(dates.sort(), zendeskId)
  console.log(payload)
  sendManualAuditDataRequestPayloadToInitiateQueue(payload)
    .then(() => console.log('Sent SQS payload to initiate queue'))
    .catch((error: unknown) => {
      console.error('Failed to send payload to queue', error)
      process.exit(1)
    })
}
