import { CopyObjectCommand } from '@aws-sdk/client-s3'
import { TEST_DATA_BUCKET_NAME } from '../../constants/awsParameters'
import { s3Client } from './s3Client'

export const copyAuditDataFromTestDataBucket = async (
  targetBucket: string,
  targetDatePrefix: string,
  targetHourPrefix: string,
  fileName: string
) => {
  const input = {
    Bucket: targetBucket,
    CopySource: `${TEST_DATA_BUCKET_NAME}/${fileName}`,
    Key: `firehose/${targetDatePrefix}/${targetHourPrefix}/${fileName}`
  }
  const command = new CopyObjectCommand(input)

  return await s3Client.send(command)
}
