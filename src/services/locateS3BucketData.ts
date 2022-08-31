import { DataRequestParams } from '../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../types/s3BucketDataLocationResult'
import { listS3Objects } from './listS3Objects'
import { ANALYSIS_BUCKET_NAME, AUDIT_BUCKET_NAME } from '../utils/constants'
import { getEpochDate } from '../utils/helpers'

export const locateS3BucketData = async (
  dataRequestParams: DataRequestParams
): Promise<S3BucketDataLocationResult> => {
  console.log('Looking for S3 data using params', dataRequestParams)

  const objectPrefixes = getObjectPrefixes(
    dataRequestParams.dateFrom,
    dataRequestParams.dateTo
  )

  const objectsToCopy = await getObjectsToCopy(
    objectPrefixes,
    AUDIT_BUCKET_NAME,
    ANALYSIS_BUCKET_NAME
  )
  console.log('Objects to copy:', objectsToCopy)

  // For now we keep things in such a way that the webhook will still return a successful result
  return Promise.resolve({
    standardTierLocations: ['myLocation1'],
    glacierTierLocations: ['myGlacierLocation2'],
    dataAvailable: true
  })
}

export const getObjectPrefixes = (
  dateFrom: string,
  dateTo: string
): string[] => {
  const startDate = getEpochDate(dateFrom)
  const endDate = getEpochDate(dateTo)

  if (endDate < startDate) throw Error('End date before start date')

  const timeRange = generateTimeRange(startDate, endDate)

  return timeRangeToObjectPrefixes(timeRange)
}

const generateTimeRange = (epochStartDate: number, epochEndDate: number) => {
  // Include the last hour of the previous day
  const iterateHour = new Date(epochStartDate)
  iterateHour.setUTCHours(iterateHour.getUTCHours() - 1)

  // Set end to be the last hour in the last day
  const lastHour = new Date(epochEndDate)
  lastHour.setUTCHours(lastHour.getUTCHours() + 23)

  const timeRange = []

  while (iterateHour <= new Date(lastHour)) {
    timeRange.push(new Date(iterateHour))
    iterateHour.setUTCHours(iterateHour.getUTCHours() + 1)
  }

  // Include the first hour of the next day
  timeRange.push(new Date(iterateHour))

  return timeRange
}

const timeRangeToObjectPrefixes = (timeRange: Date[]) => {
  return timeRange.map((date) => {
    const year = date.getUTCFullYear()
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = date.getUTCDate().toString().padStart(2, '0')
    const hours = date.getUTCHours().toString().padStart(2, '0')

    return `firehose/${year}/${month}/${day}/${hours}`
  })
}

export const getObjectsToCopy = async (
  prefixes: string[],
  auditBucketName: string,
  analysisBucketName: string
): Promise<string[]> => {
  const requestedAuditBucketObjects = await Promise.all(
    prefixes.map(
      async (prefix) =>
        await listS3Objects({ Bucket: auditBucketName, Prefix: prefix })
    )
  ).then((objects: string[][]) => objects.flat())

  const existingAnalysisBucketObjects = await Promise.all(
    prefixes.map(
      async (prefix) =>
        await listS3Objects({ Bucket: analysisBucketName, Prefix: prefix })
    )
  ).then((objects: string[][]) => objects.flat())

  console.log(
    'Objects present in analysis bucket:',
    existingAnalysisBucketObjects
  )

  const objectsToCopy = requestedAuditBucketObjects.filter(
    (object) => !existingAnalysisBucketObjects.includes(object)
  )

  return objectsToCopy
}
