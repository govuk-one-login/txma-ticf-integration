import { CopyObjectCommand } from '@aws-sdk/client-s3'
import { TEST_DATA_BUCKET_NAME } from '../../constants/awsParameters'
import { s3Client } from './s3Client'

export const copyAuditDataFromTestDataBucket = async (
  targetBucket: string,
  key: string,
  testfileName: string,
  storageClass: 'GLACIER' | 'STANDARD' = 'STANDARD'
) => {
  const input = {
    Bucket: targetBucket,
    CopySource: `${TEST_DATA_BUCKET_NAME}/${testfileName}`,
    Key: key,
    StorageClass: storageClass
  }
  const command = new CopyObjectCommand(input)

  try {
    return await s3Client.send(command)
  } catch (error) {
    throw new Error(
      `Failed to copy from ${input.CopySource} to bucket ${targetBucket}\n${error}`
    )
  }
}
