import { CopyObjectCommand } from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { s3Client } from './s3Client'

export const copyAuditDataFromTestDataBucket = async (
  targetBucket: string,
  key: string,
  testfileName: string,
  storageClass: 'GLACIER' | 'STANDARD' = 'STANDARD',
  cleanup = false
) => {
  const input = {
    Bucket: targetBucket,
    CopySource: `${getEnv('TEST_DATA_BUCKET_NAME')}/${testfileName}`,
    Key: key,
    StorageClass: storageClass,
    ...(cleanup && { Tagging: 'autoTest=true' }),
    ...(cleanup && { TaggingDirective: 'REPLACE' })
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
