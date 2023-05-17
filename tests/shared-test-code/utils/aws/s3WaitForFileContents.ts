import { getEnv, pause } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const s3WaitForFileContents = async (
  bucketName: string,
  key: string
): Promise<string | undefined> => {
  const maxAttempts = 10
  let attempts = 0
  while (attempts < maxAttempts) {
    attempts++
    if (attempts >= maxAttempts) {
      throw Error(
        `Failed to find file with key ${key} in bucket ${bucketName} after ${maxAttempts} attempts`
      )
    }
    const fileContents = await invokeLambdaFunction(
      getEnv('S3_READ_FILE_FUNCTION_NAME'),
      { bucketName, key }
    )
    if (fileContents) {
      console.log(`Found file ${key} in bucket ${bucketName}`)
      return fileContents as string
    }
    console.log(
      `Waiting for 2 seconds for file with prefix ${key} in bucket ${bucketName}. ${attempts} attempts`
    )
    await pause(2000)
  }
}
