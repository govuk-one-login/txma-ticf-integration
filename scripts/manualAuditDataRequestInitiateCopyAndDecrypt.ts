import { program } from 'commander'
import { generateInitiateCopyAndDecryptPayload } from './manualAuditDataRequests/initiateCopyAndDecrypt/generateInitiateCopyAndDecryptPayload'
import { isStringArray } from './utils/isStringArray'
import { sendManualAuditDataRequestPayloadToInitiateQueue } from './manualAuditDataRequests/initiateCopyAndDecrypt/sendManualAuditDataRequestPayloadToInitiateQueue'

program
  .option(
    '--dates [dates...]',
    'The dates of audit files to copy for analysis in the format "YYYY-MM-DD"'
  )
  .option(
    '--zendeskId',
    'The Zendesk ticket id for the request',
    Math.floor(Math.random() * 1000000).toString()
  )

program.parse(process.argv)

const options = program.opts()
const dates: string[] = options.dates
const zendeskId: string = options.zendeskId

if ((!dates && !isStringArray(dates)) || !zendeskId) {
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
