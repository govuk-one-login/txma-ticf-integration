import { SQSClient } from '@aws-sdk/client-sqs'
import { AWS_REGION } from '../../constants/awsParameters'

export const sqsClient = new SQSClient({ region: AWS_REGION })
