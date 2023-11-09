import { InvalidArgumentError } from '@commander-js/extra-typings'
import { isStringArray, testVariadicArgs } from './cliUtils'

describe('testing CLI utils', () => {
  const table = [
    { array: [], value: true },
    { array: ['one'], value: true },
    { array: ['one', 'two'], value: true }
  ]

  it.each(table)('testing is string array %p', ({ array, value }) => {
    expect(isStringArray(array)).toBe(value)
  })
})

const sampleTesterFunctionIsString = (str: string) => {
  return typeof str === 'string'
}

describe('test variadic args', () => {
  it('tester function is called, it returns false. test error', async () => {
    try {
      testVariadicArgs(
        123 as unknown as string,
        '123',
        sampleTesterFunctionIsString
      )
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidArgumentError)
      expect((error as Error).message).toBe(
        'Value provided does not match supported format'
      )
    }
  })

  it('tester function is called, all values pass tester function', async () => {
    const result = testVariadicArgs('123', '456', sampleTesterFunctionIsString)
    expect(result).toStrictEqual(['123'])
  })

  it('tester function is called, all values pass tester function, previous value is an array', async () => {
    const result = testVariadicArgs(
      '789',
      ['456', '123'],
      sampleTesterFunctionIsString
    )
    expect(result).toStrictEqual(['456', '123', '789'])
  })
})
