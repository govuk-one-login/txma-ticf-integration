import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { pause } from '../helpers'
import { s3Client } from './s3Client'

export const s3WaitForFile = async (bucket: string, key: string) => {
  const maxAttempts = 10
  let attempts = 0
  while (attempts < maxAttempts) {
    attempts++
    if (attempts > maxAttempts) {
      break
    }
    if (await s3FileExists(bucket, key)) {
      break
    }
    console.log(
      `Waiting for 2 seconds for file with prefix ${key} in bucket ${bucket}`
    )
    await pause(2000)
  }
}

const s3FileExists = async (
  bucket: string,
  s3Key: string
): Promise<boolean> => {
  try {
    const headObjectResponse = await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: s3Key
      })
    )

    return !!headObjectResponse.ContentLength
  } catch (err) {
    const notFoundError = err as { name: string }
    if (notFoundError && notFoundError.name === 'NotFound') {
      return false
    }
    throw err
  }
}
