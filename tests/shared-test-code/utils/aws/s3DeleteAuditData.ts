import { DeleteObjectCommandInput } from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const deleteAuditData = async (bucket: string, key: string) => {
  const input = {
    Bucket: bucket,
    Key: `firehose/${key}`
  } as DeleteObjectCommandInput

  try {
    await invokeLambdaFunction(getEnv('S3_OPERATIONS_FUNCTION_NAME'), {
      commandType: 'DeleteObjectCommand',
      commandInput: input
    })
  } catch (error) {
    throw new Error(`Failed to delete data in bucket ${bucket}\n${error}`)
  }
}
