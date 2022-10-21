import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { AWS_REGION } from '../../constants/awsParameters'

export const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION
})
