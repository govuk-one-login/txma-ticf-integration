import { ListObjectsCommand } from '@aws-sdk/client-s3'
import { getEnv } from '../helpers'
import { s3Client } from './s3Client'

export const getAvailableTestDate = async () => {
  return findAvailableS3Locations(generateRandomDateAndPrefix())
}

const findAvailableS3Locations = async (checkDate: MatchedDateAndPrefix) => {
  const buckets = [getEnv('ANALYSIS_BUCKET_NAME'), getEnv('AUDIT_BUCKET_NAME')]

  const locationAvailability = await Promise.all(
    buckets.map(async (bucket) => {
      const input = {
        Bucket: bucket,
        Prefix: checkDate.prefix
      }
      const command = new ListObjectsCommand(input)
      const response = await s3Client.send(command)

      return !response.Contents || response.Contents.length === 0 ? true : false
    })
  )

  if (locationAvailability.includes(false)) {
    await findAvailableS3Locations(generateRandomDateAndPrefix())
  }

  return checkDate
}

const generateRandomDateAndPrefix = (): MatchedDateAndPrefix => {
  const date = new Date(Math.random() * Date.now())
  const isoDate = date.toISOString().split('T')[0]
  const isoDateParts = isoDate.split('-')

  const year = isoDateParts[0]
  const month = isoDateParts[1]
  const day = isoDateParts[2]

  return {
    date: isoDate,
    prefix: `firehose/${year}/${month}/${day}`
  }
}

type MatchedDateAndPrefix = {
  date: string
  prefix: string
}
