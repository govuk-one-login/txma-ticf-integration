import { program } from 'commander'
import { generateInitiateCopyAndDecryptPayload } from './manualAuditDataRequests/initiateCopyAndDecrypt/generateInitiateCopyAndDecryptPayload'
import { isDatesArray } from './manualAuditDataRequests/initiateCopyAndDecrypt/isDatesArray'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './manualAuditDataRequests/initiateCopyAndDecrypt/sendManualAuditDataRequestPayloadToInitiateQueue'
import { AWS_REGION } from './utils/constants'

process.env.AWS_REGION = AWS_REGION

program
  .requiredOption(
    '--dates [dates...]',
    'The dates of audit files to copy for analysis in the format "YYYY-MM-DD"'
  )
  .requiredOption('--zendeskId <id>', 'The Zendesk ticket id for the request')

program.parse(process.argv)

const options = program.opts()
const dates: string[] = options.dates
const zendeskId: string = options.zendeskId

if (!isDatesArray(dates) || !zendeskId) {
  console.error(
    'Invalid input parameters, please ensure all parameters are assigned the correct value'
  )
} else {
  const payload = generateInitiateCopyAndDecryptPayload(dates, zendeskId)

  sendManualAuditDataRequestPayloadToInitiateQueue(payload)
    .then(() => console.log('Sent SQS payload to initiate queue'))
    .catch((error: unknown) => {
      console.error('Failed to send payload to queue', error)
      process.exit(1)
    })
}
