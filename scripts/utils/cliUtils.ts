import { InvalidArgumentError } from '@commander-js/extra-typings'

export const testVariadicArgs = (
  currentValue: string,
  previousValue: string | string[],
  testerFunction: (_valueToTest: string) => boolean
) => {
  if (!testerFunction(currentValue)) {
    throw new InvalidArgumentError('Daterange does not match supported format')
  }

  if (!Array.isArray(previousValue)) {
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
