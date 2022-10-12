import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const region = 'eu-west-2'
const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: `${region}`
})

const dynamoDBClient = new DynamoDBClient({
  region: `${region}`
})

export { cloudWatchLogsClient, dynamoDBClient }
