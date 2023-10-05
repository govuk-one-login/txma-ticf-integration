import { HeadObjectCommandOutput } from '@aws-sdk/client-s3'
import { getEnv } from '../../helpers'
import { invokeLambdaFunction } from '../invokeLambdaFunction'

export const s3HeadObject = (
  bucket: string,
  s3Key: string
): Promise<HeadObjectCommandOutput> => {
  return invokeLambdaFunction(getEnv('S3_OPERATIONS_FUNCTION_NAME'), {
    commandType: 'HeadObjectCommand',
    commandInput: {
      Bucket: bucket,
      Key: s3Key
    }
  })
}
