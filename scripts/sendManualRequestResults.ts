import { program } from 'commander'
import { readFileSync } from 'fs'
import { copyManualRequestData } from './manualRequests/copyManualRequestData'
import {
  sendManualQueryPayload,
  validateSendManualQueryPayload
} from './manualRequests/sendManualQueryPayload'
import { sendSQSMessageToCompletedQueue } from './manualRequests/sendSQSMessageToCompletedQueue'

process.env.AWS_Region = 'eu-west-2'

program
  .option(
    '--path <path>',
    'Path of SQS JSON file containing the ZendeskId, AthenaQueryId, Recipient Name, and Email'
  )
  .option('--env <env>', 'The Environment name')
  .option('--queueUrl <url>', 'The query complete QueueUrl')
  .option('--analysisBucketName <name>', 'The name of the analysis bucket')

program.parse(process.argv)

const options = program.opts()

const path: string = options.path
const environment: string = options.env

process.env.ANALYSIS_BUCKET_NAME = options.analysisBucketName
process.env.QUERY_COMPLETED_QUEUE_URL = options.queueUrl

const sqsJSON: sendManualQueryPayload = JSON.parse(readFileSync(path, 'utf-8'))

const environmentIsValid = (environmentToCheck: string): boolean =>
  ['dev', 'build', 'staging', 'integration', 'production'].includes(
    environmentToCheck
  )

if (!environment) {
  console.error(
    'No environment specified with the --env parameter, should be one of dev, build, staging, production, integration'
  )
} else if (!environmentIsValid(environment)) {
  console.error(
    `Invalid environment '${environment}' specified, should be one of dev, build, staging, integration, production`
  )
} else if (!validateSendManualQueryPayload(sqsJSON)) {
  console.error(
    `Invalid sqsPayload at path:'${path}', please ensure all fields are present.`
  )
} else {
  copyManualRequestData(sqsJSON.athenaQueryId).then(() =>
    console.log('Copied data within output bucket')
  )
  sendSQSMessageToCompletedQueue(sqsJSON).then(() =>
    console.log('Sent SQS payload to query completed queue')
  )
}

console.log(
  'Successfully sent SQS message to completed query queue, recipient will recieve email with download link'
)
