import { StorageClass } from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const s3ChangeStorageClass = async (
  bucket: string,
  key: string,
  storageClass: StorageClass
) => {
  try {
    await invokeLambdaFunction(getEnv('COPY_S3_FILE_FUNCTION_NAME'), {
      CopySource: `${bucket}/${key}`,
      Bucket: bucket,
      StorageClass: storageClass,
      Key: key
    })
  } catch (error) {
    throw Error(
      `Error while calling Copy S3 lambda to update storage class for file '${key}' in bucket ${bucket}: \n${error}`
    )
  }
}
