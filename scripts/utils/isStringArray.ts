export const isStringArray = (array: unknown) =>
  Array.isArray(array) &&
  array.length > 0 &&
  array.every((value) => {
    return typeof value === 'string'
  })
