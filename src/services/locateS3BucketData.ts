import { DataRequestParams } from '../types/dataRequestParams'
import { S3BucketDataLocationResult } from '../types/s3BucketDataLocationResult'
import { listS3Objects } from './listS3Objects'
import { ANALYSIS_BUCKET_NAME, AUDIT_BUCKET_NAME } from '../utils/constants'

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
  const dateFromParts = dateFrom.split('/')
  const dateToParts = dateTo.split('/')

  const start = Date.UTC(
    parseInt(dateFromParts[0]),
    parseInt(dateFromParts[1]) - 1,
    parseInt(dateFromParts[2])
  )
  const end = Date.UTC(
    parseInt(dateToParts[0]),
    parseInt(dateToParts[1]) - 1,
    parseInt(dateToParts[2]),
    23
  )

  if (isNaN(start) || isNaN(end)) throw Error('Invalid dates received')
  if (end < start) throw Error('End date before start date')

  const currentDate = new Date(start)
  const dates = []

  // Include the last hour of the previous day
  currentDate.setUTCHours(currentDate.getUTCHours() - 1)

  while (currentDate <= new Date(end)) {
    dates.push(new Date(currentDate))
    currentDate.setUTCHours(currentDate.getUTCHours() + 1)
  }

  // Include the first hour of the next day
  dates.push(new Date(currentDate))

  const objects = dates.map((date) => {
    const year = date.getUTCFullYear()
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = date.getUTCDate().toString().padStart(2, '0')
    const hour = date.getUTCHours().toString().padStart(2, '0')

    return `${year}/${month}/${day}/${hour}`
  })

  return objects
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
