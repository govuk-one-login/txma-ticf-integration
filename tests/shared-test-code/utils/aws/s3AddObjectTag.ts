import { PutObjectTaggingCommandOutput, Tag } from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const s3AddObjectTag = (
  bucket: string,
  key: string,
  tags: Tag[]
): Promise<PutObjectTaggingCommandOutput> => {
  return invokeLambdaFunction(getEnv('S3_OPERATIONS_FUNCTION_NAME'), {
    commandType: 'PutObjectTaggingCommand',
    commandInput: {
      Bucket: bucket,
      Key: key,
      Tagging: {
        TagSet: tags
      }
    }
  })
}
