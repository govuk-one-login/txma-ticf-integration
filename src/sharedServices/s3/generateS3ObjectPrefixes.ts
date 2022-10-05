import { getEpochDate } from '../../utils/helpers'

export const generateS3ObjectPrefixes = (
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
