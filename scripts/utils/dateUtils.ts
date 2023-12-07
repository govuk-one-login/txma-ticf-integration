import { testVariadicArgs } from './cliUtils'
import { DATE_RANGE_REGEX, DATE_REGEX } from './constants'

export const isDateString = (date: string): boolean => {
  return DATE_REGEX.test(date)
}

export const testDateArgs = (
  currentValue: string,
  previousValue: string | string[]
) => {
  return testVariadicArgs(currentValue, previousValue, isDateString)
}

export const isDateRange = (daterange: string) => {
  return DATE_RANGE_REGEX.test(daterange)
}

export const testDateRangeArgs = (
  currentValue: string,
  previousValue: string | string[]
) => {
  return testVariadicArgs(currentValue, previousValue, isDateRange)
}

export const convertDateRangeToDateArray = (daterangeArray: string[]) => {
  const dateRangeArray = daterangeArray.map((daterange) => {
    const dates = daterange.split('-')
    const endDateObj = new Date(dates[1])

    const dateArray: Date[] = []
    dateArray.push(new Date(dates[0]))

    while (dateArray[dateArray.length - 1].valueOf() < endDateObj.valueOf()) {
      const dateIncreasedByOne = addDay(dateArray[dateArray.length - 1])
      dateArray.push(dateIncreasedByOne)
    }
    return dateArray
  })

  const flatDateArray = dateRangeArray.flat()
  const datesAsString = flatDateArray.map((date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  })

  return Array.from(new Set(datesAsString))
}

export const addDay = (date: Date) => {
  const newDate = new Date(date.valueOf())
  newDate.setDate(newDate.getDate() + 1)
  return newDate
}
