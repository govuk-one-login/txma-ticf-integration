import { program } from 'commander'
import { readFileSync } from 'fs'
import { getEnv } from '../src/utils/helpers'
import { copyManualRequestData } from './manualRequests/copyManualRequestData'
import { getQueueUrl } from './manualRequests/getQueueUrl'
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
  .option(
    '--queueName <url>',
    'The query complete queueName for the environment you want to use'
  )
  .option('--analysisBucketName <name>', 'The name of the analysis bucket')

program.parse(process.argv)

const options = program.opts()

const queueName: string = options.queueName
const path: string = options.path

process.env.ANALYSIS_BUCKET_NAME = options.analysisBucketName
getQueueUrl(queueName).then(
  (queueName) => (process.env.QUERY_COMPLETED_QUEUE_URL = queueName)
)
const sqsJSON: sendManualQueryPayload = JSON.parse(readFileSync(path, 'utf-8'))
if (!validateSendManualQueryPayload(sqsJSON)) {
  console.error(
    `Invalid sqsPayload at path:'${path}', please ensure all fields are present.`
  )
} else if (!getEnv('QUERY_COMPLETED_QUEUE_URL')) {
  console.error('Queue url not set, please check queue name is correct')
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
