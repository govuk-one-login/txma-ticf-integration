const daterangeRegex = /\d{4}\/\d{2}\/\d{2}-\d{4}\/\d{2}\/\d{2}/

export const isDateRangeArray = (daterangeArray: string[]) => {
  return (
    Array.isArray(daterangeArray) &&
    daterangeArray.length > 0 &&
    daterangeArray.every(
      (date) => typeof date === 'string' && daterangeRegex.test(date)
    )
  )
}

export const convertDaterangeToDateArray = (daterangeArray: string[]) => {
  const dateRangeArray = daterangeArray.map((daterange) => {
    const dates = daterange.split('-')
    // const startDateObj = new Date(dates[0])
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

const addDay = (date: Date) => {
  const newDate = new Date(date.valueOf())
  newDate.setDate(newDate.getDate() + 1)
  return newDate
}
