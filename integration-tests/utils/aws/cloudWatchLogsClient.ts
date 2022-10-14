import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'
import { AWS_REGION } from '../../constants/awsParameters'

export const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: `${AWS_REGION}`
})
