import { getEnv } from '../helpers'
import { invokeLambdaFunction } from './invokeLambdaFunction'

export const getAvailableTestDate = async () => {
  return findAvailableS3Locations(generateRandomDateAndPrefix())
}

const findAvailableS3Locations = async (
  checkDate: MatchedDateAndPrefix,
  count = 0
): Promise<MatchedDateAndPrefix> => {
  count++

  if (count > 10) {
    throw new Error('Could not find available test location')
  }

  const buckets = [getEnv('ANALYSIS_BUCKET_NAME'), getEnv('AUDIT_BUCKET_NAME')]

  const locationAvailability = await Promise.all(
    buckets.map(async (bucket) => {
      const input = {
        Bucket: bucket,
        Prefix: checkDate.prefix
      }
      const response = await invokeLambdaFunction(
        getEnv('S3_OPERATIONS_FUNCTION_NAME'),
        {
          commandType: 'ListObjectsCommand',
          commandInput: input
        }
      )

      return !response.Contents || response.Contents.length === 0 ? true : false
    })
  )

  if (locationAvailability.includes(false)) {
    return await findAvailableS3Locations(generateRandomDateAndPrefix(), count)
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

interface MatchedDateAndPrefix {
  date: string
  prefix: string
}
