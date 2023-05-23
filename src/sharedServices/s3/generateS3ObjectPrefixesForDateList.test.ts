import { generateS3ObjectPrefixesForDateList } from './generateS3ObjectPrefixesForDateList'

describe('object prefixes', () => {
  test('dates on same day', () => {
    const expectedResult = ['firehose/2022/08/21']

    const result = generateS3ObjectPrefixesForDateList(['2022-08-21'])
    expect(result).toEqual(expectedResult)
  })

  test('dates on different consecutive days', async () => {
    const expectedResult = ['firehose/2022/08/21', 'firehose/2022/08/22']

    const result = generateS3ObjectPrefixesForDateList([
      '2022-08-21',
      '2022-08-22'
    ])
    expect(result).toEqual(expectedResult)
  })

  test('dates on isolated days', async () => {
    const expectedResult = ['firehose/2022/08/21', 'firehose/2022/09/01']

    const result = generateS3ObjectPrefixesForDateList([
      '2022-08-21',
      '2022-09-01'
    ])
    expect(result).toEqual(expectedResult)
  })

  test('daylight savings', async () => {
    const expectedResult = ['firehose/2022/11/21']

    const result = generateS3ObjectPrefixesForDateList(['2022-11-21'])
    expect(result).toEqual(expectedResult)
  })

  test('invalid date', () => {
    expect(() => {
      generateS3ObjectPrefixesForDateList(['2022343-130-32'])
    }).toThrow("String '2022343-130-32' is not a valid date")
  })

  test('invalid date string', () => {
    expect(() => {
      generateS3ObjectPrefixesForDateList(['invalid'])
    }).toThrow("String 'invalid' is not a valid date")
  })
})
