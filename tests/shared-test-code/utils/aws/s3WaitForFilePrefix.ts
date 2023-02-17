import { ListObjectsCommand } from '@aws-sdk/client-s3'
import { pause } from '../helpers'
import { s3Client } from './s3Client'

export const s3WaitForFilePrefix = async (bucket: string, prefix: string) => {
  const maxAttempts = 10
  let attempts = 0
  while (attempts < maxAttempts) {
    attempts++
    if (attempts > maxAttempts) {
      break
    }
    if (await s3PrefixHasData(bucket, prefix)) {
      console.log(`Found data in bucket ${bucket} for prefix ${prefix}`)
      break
    }
    console.log(
      `Waiting for 1 second for file with prefix ${prefix} in bucket ${bucket}`
    )
    await pause(1000)
  }
}

const s3PrefixHasData = async (bucket: string, prefix: string) => {
  const input = {
    Bucket: bucket,
    Prefix: prefix
  }
  const command = new ListObjectsCommand(input)
  const response = await s3Client.send(command)
  return !!response.Contents
}
