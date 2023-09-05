export const isDatesArray = (array: unknown): boolean => {
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/

  return (
    Array.isArray(array) &&
    array.length > 0 &&
    array.every(
      (date) => typeof date === 'string' && dateFormatRegex.test(date)
    )
  )
}
