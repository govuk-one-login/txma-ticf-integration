import { getEnv } from '../../common/utils/helpers'

import { AthenaClient } from '@aws-sdk/client-athena'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { S3ControlClient } from '@aws-sdk/client-s3-control'
import { SQSClient } from '@aws-sdk/client-sqs'
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

export const athenaClient = new AthenaClient({ region: getEnv('AWS_REGION') })
export const ddbClient = new DynamoDBClient({ region: getEnv('AWS_REGION') })
export const s3Client = new S3Client({ region: getEnv('AWS_REGION') })
export const s3ControlClient = new S3ControlClient({
  region: getEnv('AWS_REGION')
})
export const sqsClient = new SQSClient({ region: getEnv('AWS_REGION') })
export const secretsManagerClient = new SecretsManagerClient({
  region: getEnv('AWS_REGION')
})
