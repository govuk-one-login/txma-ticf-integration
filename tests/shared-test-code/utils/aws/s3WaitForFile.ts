import { getEnv, pause } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const s3WaitForFile = async (bucket: string, key: string) => {
  const maxAttempts = 10
  let attempts = 0
  while (attempts < maxAttempts) {
    attempts++
    if (attempts >= maxAttempts) {
      throw Error(
        `Failed to find file with key ${key} in bucket ${bucket} after ${maxAttempts} attempts`
      )
    }
    if (await s3FileExists(bucket, key)) {
      console.log(`Found file ${key} in bucket ${bucket}`)
      break
    }
    console.log(
      `Waiting for 2 seconds for file with prefix ${key} in bucket ${bucket}. ${attempts} attempts`
    )
    await pause(2000)
  }
}

const s3FileExists = async (
  bucketName: string,
  key: string
): Promise<boolean> => {
  const response = await invokeLambdaFunction(
    getEnv('CHECK_S3_FILE_EXISTS_FUNCTION_NAME'),
    { bucketName, key }
  )
  return response.fileExists
}
