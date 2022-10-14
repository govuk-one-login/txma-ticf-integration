import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { SQSClient } from '@aws-sdk/client-sqs'

const region = 'eu-west-2'
const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: `${region}`
})

const dynamoDBClient = new DynamoDBClient({
  region: `${region}`
})

const sqsClient = new SQSClient({ region: `${region}` })

export { cloudWatchLogsClient, dynamoDBClient, sqsClient }
