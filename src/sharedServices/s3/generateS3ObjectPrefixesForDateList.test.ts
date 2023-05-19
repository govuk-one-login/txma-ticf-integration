import { generateS3ObjectPrefixesForDateList } from './generateS3ObjectPrefixesForDateList'

describe('object prefixes', () => {
  test('dates on same day', () => {
    const expectedResult = [
      // 'firehose/2022/08/20/23',
      // 'firehose/2022/08/21/00',
      // 'firehose/2022/08/21/01',
      // 'firehose/2022/08/21/02',
      // 'firehose/2022/08/21/03',
      // 'firehose/2022/08/21/04',
      // 'firehose/2022/08/21/05',
      // 'firehose/2022/08/21/06',
      // 'firehose/2022/08/21/07',
      // 'firehose/2022/08/21/08',
      // 'firehose/2022/08/21/09',
      // 'firehose/2022/08/21/10',
      // 'firehose/2022/08/21/11',
      // 'firehose/2022/08/21/12',
      // 'firehose/2022/08/21/13',
      // 'firehose/2022/08/21/14',
      // 'firehose/2022/08/21/15',
      // 'firehose/2022/08/21/16',
      // 'firehose/2022/08/21/17',
      // 'firehose/2022/08/21/18',
      // 'firehose/2022/08/21/19',
      // 'firehose/2022/08/21/20',
      // 'firehose/2022/08/21/21',
      // 'firehose/2022/08/21/22',
      // 'firehose/2022/08/21/23',
      // 'firehose/2022/08/22/00'
      'firehose/2022/08/20',
      'firehose/2022/08/21',
      'firehose/2022/08/22'
    ]

    const result = generateS3ObjectPrefixesForDateList(['2022-08-21'])
    expect(result).toEqual(expectedResult)
  })

  test('dates on different consecutive days', async () => {
    const expectedResult = [
      // 'firehose/2022/08/20/23',
      // 'firehose/2022/08/21/00',
      // 'firehose/2022/08/21/01',
      // 'firehose/2022/08/21/02',
      // 'firehose/2022/08/21/03',
      // 'firehose/2022/08/21/04',
      // 'firehose/2022/08/21/05',
      // 'firehose/2022/08/21/06',
      // 'firehose/2022/08/21/07',
      // 'firehose/2022/08/21/08',
      // 'firehose/2022/08/21/09',
      // 'firehose/2022/08/21/10',
      // 'firehose/2022/08/21/11',
      // 'firehose/2022/08/21/12',
      // 'firehose/2022/08/21/13',
      // 'firehose/2022/08/21/14',
      // 'firehose/2022/08/21/15',
      // 'firehose/2022/08/21/16',
      // 'firehose/2022/08/21/17',
      // 'firehose/2022/08/21/18',
      // 'firehose/2022/08/21/19',
      // 'firehose/2022/08/21/20',
      // 'firehose/2022/08/21/21',
      // 'firehose/2022/08/21/22',
      // 'firehose/2022/08/21/23',
      // 'firehose/2022/08/22/00',
      // 'firehose/2022/08/22/01',
      // 'firehose/2022/08/22/02',
      // 'firehose/2022/08/22/03',
      // 'firehose/2022/08/22/04',
      // 'firehose/2022/08/22/05',
      // 'firehose/2022/08/22/06',
      // 'firehose/2022/08/22/07',
      // 'firehose/2022/08/22/08',
      // 'firehose/2022/08/22/09',
      // 'firehose/2022/08/22/10',
      // 'firehose/2022/08/22/11',
      // 'firehose/2022/08/22/12',
      // 'firehose/2022/08/22/13',
      // 'firehose/2022/08/22/14',
      // 'firehose/2022/08/22/15',
      // 'firehose/2022/08/22/16',
      // 'firehose/2022/08/22/17',
      // 'firehose/2022/08/22/18',
      // 'firehose/2022/08/22/19',
      // 'firehose/2022/08/22/20',
      // 'firehose/2022/08/22/21',
      // 'firehose/2022/08/22/22',
      // 'firehose/2022/08/22/23',
      // 'firehose/2022/08/23/00'
      'firehose/2022/08/20',
      'firehose/2022/08/21',
      'firehose/2022/08/22',
      'firehose/2022/08/23'
    ]

    const result = generateS3ObjectPrefixesForDateList([
      '2022-08-21',
      '2022-08-22'
    ])
    expect(result).toEqual(expectedResult)
  })

  test('dates on isolated days', async () => {
    const expectedResult = [
      // 'firehose/2022/08/20/23',
      // 'firehose/2022/08/21/00',
      // 'firehose/2022/08/21/01',
      // 'firehose/2022/08/21/02',
      // 'firehose/2022/08/21/03',
      // 'firehose/2022/08/21/04',
      // 'firehose/2022/08/21/05',
      // 'firehose/2022/08/21/06',
      // 'firehose/2022/08/21/07',
      // 'firehose/2022/08/21/08',
      // 'firehose/2022/08/21/09',
      // 'firehose/2022/08/21/10',
      // 'firehose/2022/08/21/11',
      // 'firehose/2022/08/21/12',
      // 'firehose/2022/08/21/13',
      // 'firehose/2022/08/21/14',
      // 'firehose/2022/08/21/15',
      // 'firehose/2022/08/21/16',
      // 'firehose/2022/08/21/17',
      // 'firehose/2022/08/21/18',
      // 'firehose/2022/08/21/19',
      // 'firehose/2022/08/21/20',
      // 'firehose/2022/08/21/21',
      // 'firehose/2022/08/21/22',
      // 'firehose/2022/08/21/23',
      // 'firehose/2022/08/22/00',
      // 'firehose/2022/08/31/23',
      // 'firehose/2022/09/01/00',
      // 'firehose/2022/09/01/01',
      // 'firehose/2022/09/01/02',
      // 'firehose/2022/09/01/03',
      // 'firehose/2022/09/01/04',
      // 'firehose/2022/09/01/05',
      // 'firehose/2022/09/01/06',
      // 'firehose/2022/09/01/07',
      // 'firehose/2022/09/01/08',
      // 'firehose/2022/09/01/09',
      // 'firehose/2022/09/01/10',
      // 'firehose/2022/09/01/11',
      // 'firehose/2022/09/01/12',
      // 'firehose/2022/09/01/13',
      // 'firehose/2022/09/01/14',
      // 'firehose/2022/09/01/15',
      // 'firehose/2022/09/01/16',
      // 'firehose/2022/09/01/17',
      // 'firehose/2022/09/01/18',
      // 'firehose/2022/09/01/19',
      // 'firehose/2022/09/01/20',
      // 'firehose/2022/09/01/21',
      // 'firehose/2022/09/01/22',
      // 'firehose/2022/09/01/23',
      // 'firehose/2022/09/02/00'
      'firehose/2022/08/20',
      'firehose/2022/08/21',
      'firehose/2022/08/22',
      'firehose/2022/08/31',
      'firehose/2022/09/01',
      'firehose/2022/09/02'
    ]

    const result = generateS3ObjectPrefixesForDateList([
      '2022-08-21',
      '2022-09-01'
    ])
    expect(result).toEqual(expectedResult)
  })

  test('daylight savings', async () => {
    const expectedResult = [
      // 'firehose/2022/11/20/23',
      // 'firehose/2022/11/21/00',
      // 'firehose/2022/11/21/01',
      // 'firehose/2022/11/21/02',
      // 'firehose/2022/11/21/03',
      // 'firehose/2022/11/21/04',
      // 'firehose/2022/11/21/05',
      // 'firehose/2022/11/21/06',
      // 'firehose/2022/11/21/07',
      // 'firehose/2022/11/21/08',
      // 'firehose/2022/11/21/09',
      // 'firehose/2022/11/21/10',
      // 'firehose/2022/11/21/11',
      // 'firehose/2022/11/21/12',
      // 'firehose/2022/11/21/13',
      // 'firehose/2022/11/21/14',
      // 'firehose/2022/11/21/15',
      // 'firehose/2022/11/21/16',
      // 'firehose/2022/11/21/17',
      // 'firehose/2022/11/21/18',
      // 'firehose/2022/11/21/19',
      // 'firehose/2022/11/21/20',
      // 'firehose/2022/11/21/21',
      // 'firehose/2022/11/21/22',
      // 'firehose/2022/11/21/23',
      // 'firehose/2022/11/22/00'
      'firehose/2022/11/20',
      'firehose/2022/11/21',
      'firehose/2022/11/22'
    ]

    const result = generateS3ObjectPrefixesForDateList(['2022-11-21'])
    expect(result).toEqual(expectedResult)
  })

  test('invalid date string', () => {
    expect(() => {
      generateS3ObjectPrefixesForDateList(['invalid'])
    }).toThrow("String 'invalid' is not a valid date")
  })
})
