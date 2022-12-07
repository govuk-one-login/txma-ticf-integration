import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'
import { getEnv } from '../helpers'

export const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: getEnv('AWS_REGION')
})
