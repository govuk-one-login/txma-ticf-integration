export const isStringArray = (array: unknown) => {
  return (
    typeof array === 'object' &&
    Array.isArray(array) &&
    array.every((item) => typeof item === 'string')
  )
}
