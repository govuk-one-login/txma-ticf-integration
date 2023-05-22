export const generateS3ObjectPrefixesForDateList = (
  dateStrings: string[]
): string[] => {
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
