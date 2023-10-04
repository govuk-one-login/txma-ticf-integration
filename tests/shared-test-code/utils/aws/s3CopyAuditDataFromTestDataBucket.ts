import { CopyObjectCommandInput } from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

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
  } as CopyObjectCommandInput
  try {
    await invokeLambdaFunction(getEnv('COPY_S3_FILE_FUNCTION_NAME'), input)
  } catch (error) {
    throw new Error(
      `Failed to copy from ${input.CopySource} to bucket ${targetBucket}\n${error}`
    )
  }
}
