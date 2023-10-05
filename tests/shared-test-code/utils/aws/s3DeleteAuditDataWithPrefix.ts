import {
  DeleteObjectsCommandInput,
  ListObjectsV2CommandOutput
} from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const deleteAuditDataWithPrefix = async (
  bucket: string,
  prefix: string
) => {
  const listObjectsInput = {
    Bucket: bucket,
    Prefix: prefix
  }

  let objects

  try {
    const listObjectsResponse = (await invokeLambdaFunction(
      getEnv('S3_OPERATIONS_FUNCTION_NAME'),
      {
        commandType: 'ListObjectsV2Command',
        commandInput: listObjectsInput
      }
    )) as ListObjectsV2CommandOutput

    objects = listObjectsResponse.Contents

    if (!objects || objects?.length === 0) return
  } catch (error) {
    throw new Error(`Failed to list objects in bucket ${bucket}\n${error}`)
  }

  const deleteObjectsInput = {
    Bucket: bucket,
    Delete: {
      Objects: []
    }
  } as DeleteObjectsCommandInput

  objects.forEach(({ Key }) => {
    deleteObjectsInput.Delete?.Objects?.push({ Key })
  })

  try {
    await invokeLambdaFunction(getEnv('S3_OPERATIONS_FUNCTION_NAME'), {
      commandType: 'DeleteObjectsCommand',
      commandInput: deleteObjectsInput
    })
  } catch (error) {
    throw new Error(`Failed to delete data in bucket ${bucket}\n${error}`)
  }
}
