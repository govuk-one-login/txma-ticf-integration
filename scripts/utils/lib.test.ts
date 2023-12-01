import { isStringArray } from './lib'

describe('testing lib functions', () => {
  const table = [
    { array: [], value: true },
    { array: ['one'], value: true },
    { array: ['one', 'two'], value: true }
  ]

  it.each(table)('testing is string array %p', ({ array, value }) => {
    expect(isStringArray(array)).toBe(value)
  })
})
