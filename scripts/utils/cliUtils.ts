import { InvalidArgumentError } from '@commander-js/extra-typings'

export const testVariadicArgs = (
  currentValue: string,
  previousValue: string | string[],
  testerFunction: (_valueToTest: string) => boolean
) => {
  if (!testerFunction(currentValue)) {
    throw new InvalidArgumentError(
      'Value provided does not match supported format'
    )
  }

  if (!Array.isArray(previousValue)) {
    // this branch only runs when the cli passes the first element, therefore, previousValue will always be undefined
    return [currentValue]
  } else {
    previousValue.push(currentValue)
    return previousValue
  }
}

export const isStringArray = (array: unknown) => {
  return (
    typeof array === 'object' &&
    Array.isArray(array) &&
    array.every((item) => typeof item === 'string')
  )
}
