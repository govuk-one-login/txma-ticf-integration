import { S3Client } from '@aws-sdk/client-s3'
import { AWS_REGION } from '../../constants/awsParameters'

export const s3Client = new S3Client({ region: AWS_REGION })
