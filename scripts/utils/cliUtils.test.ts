import { InvalidArgumentError } from '@commander-js/extra-typings'
import { testVariadicArgs } from './cliUtils'

const sampleTesterFunctionIsString = (str: string) => {
  return typeof str === 'string'
}

describe('test variadic args', () => {
  it('tester function is called, it returns false. test error', async () => {
    const invalidNumberAsString = 123 as unknown as string
    const validString = '123'
    const invalidFunction = sampleTesterFunctionIsString
    try {
      testVariadicArgs(invalidNumberAsString, validString, invalidFunction)
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
