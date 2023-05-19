// import { getEpochDate } from '../../utils/helpers'

export const generateS3ObjectPrefixesForDateList = (
  dateStrings: string[]
): string[] => {
  // const dateEpochs = dateStrings.map(getEpochDate)

  // const timeRanges: Date[] = dateEpochs.map(generateTimeRangeForDate).flat()

  // return timeRangeToObjectPrefixes(timeRanges)

  return dateStrings.map((dateString) => {
    const dateParts = dateString.split('-')

    validateDate(dateParts)

    return `firehose/${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`
  })
}

const validateDate = (dateParts: string[]) => {
  const epochDate = Date.UTC(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2])
  )

  if (isNaN(epochDate))
    throw Error(`String '${dateParts.join('-')}' is not a valid date`)
}

// const generateTimeRangeForDate = (epochStartDate: number): Date[] => {
//   // Include the last hour of the previous day
//   const iterateHour = new Date(epochStartDate)
//   iterateHour.setUTCHours(iterateHour.getUTCHours() - 1)

//   // Set end to be the last hour
//   const lastHour = new Date(epochStartDate)
//   lastHour.setUTCHours(lastHour.getUTCHours() + 23)

//   const timeRange: Date[] = []

//   while (iterateHour <= new Date(lastHour)) {
//     timeRange.push(new Date(iterateHour))
//     iterateHour.setUTCHours(iterateHour.getUTCHours() + 1)
//   }

//   // Include the first hour of the next day
//   timeRange.push(new Date(iterateHour))

//   return timeRange
// }

// const timeRangeToObjectPrefixes = (timeRange: Date[]): string[] => {
//   return dedupeArray(
//     timeRange.map((date) => {
//       const year = date.getUTCFullYear()
//       const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
//       const day = date.getUTCDate().toString().padStart(2, '0')
//       // const hours = date.getUTCHours().toString().padStart(2, '0')

//       return `firehose/${year}/${month}/${day}/`
//     })
//   )
// }

// const dedupeArray = (input: string[]) => [...new Set(input)]
