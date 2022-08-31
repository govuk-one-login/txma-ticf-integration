import { getObjectPrefixes, getObjectsToCopy } from './locateS3BucketData'
import { listS3Objects } from './listS3Objects'

jest.mock('./listS3Objects', () => ({
  listS3Objects: jest.fn()
}))
const mocklistS3Objects = listS3Objects as jest.Mock<Promise<string[]>>

describe('object prefixes', () => {
  test('dates on same day', () => {
    const expectedResult = [
      'firehose/2022/08/20/23',
      'firehose/2022/08/21/00',
      'firehose/2022/08/21/01',
      'firehose/2022/08/21/02',
      'firehose/2022/08/21/03',
      'firehose/2022/08/21/04',
      'firehose/2022/08/21/05',
      'firehose/2022/08/21/06',
      'firehose/2022/08/21/07',
      'firehose/2022/08/21/08',
      'firehose/2022/08/21/09',
      'firehose/2022/08/21/10',
      'firehose/2022/08/21/11',
      'firehose/2022/08/21/12',
      'firehose/2022/08/21/13',
      'firehose/2022/08/21/14',
      'firehose/2022/08/21/15',
      'firehose/2022/08/21/16',
      'firehose/2022/08/21/17',
      'firehose/2022/08/21/18',
      'firehose/2022/08/21/19',
      'firehose/2022/08/21/20',
      'firehose/2022/08/21/21',
      'firehose/2022/08/21/22',
      'firehose/2022/08/21/23',
      'firehose/2022/08/22/00'
    ]

    const result = getObjectPrefixes('2022/08/21', '2022/08/21')
    expect(result).toEqual(expectedResult)
  })

  test('dates on different days', async () => {
    const expectedResult = [
      'firehose/2022/08/20/23',
      'firehose/2022/08/21/00',
      'firehose/2022/08/21/01',
      'firehose/2022/08/21/02',
      'firehose/2022/08/21/03',
      'firehose/2022/08/21/04',
      'firehose/2022/08/21/05',
      'firehose/2022/08/21/06',
      'firehose/2022/08/21/07',
      'firehose/2022/08/21/08',
      'firehose/2022/08/21/09',
      'firehose/2022/08/21/10',
      'firehose/2022/08/21/11',
      'firehose/2022/08/21/12',
      'firehose/2022/08/21/13',
      'firehose/2022/08/21/14',
      'firehose/2022/08/21/15',
      'firehose/2022/08/21/16',
      'firehose/2022/08/21/17',
      'firehose/2022/08/21/18',
      'firehose/2022/08/21/19',
      'firehose/2022/08/21/20',
      'firehose/2022/08/21/21',
      'firehose/2022/08/21/22',
      'firehose/2022/08/21/23',
      'firehose/2022/08/22/00',
      'firehose/2022/08/22/01',
      'firehose/2022/08/22/02',
      'firehose/2022/08/22/03',
      'firehose/2022/08/22/04',
      'firehose/2022/08/22/05',
      'firehose/2022/08/22/06',
      'firehose/2022/08/22/07',
      'firehose/2022/08/22/08',
      'firehose/2022/08/22/09',
      'firehose/2022/08/22/10',
      'firehose/2022/08/22/11',
      'firehose/2022/08/22/12',
      'firehose/2022/08/22/13',
      'firehose/2022/08/22/14',
      'firehose/2022/08/22/15',
      'firehose/2022/08/22/16',
      'firehose/2022/08/22/17',
      'firehose/2022/08/22/18',
      'firehose/2022/08/22/19',
      'firehose/2022/08/22/20',
      'firehose/2022/08/22/21',
      'firehose/2022/08/22/22',
      'firehose/2022/08/22/23',
      'firehose/2022/08/23/00'
    ]

    const result = getObjectPrefixes('2022/08/21', '2022/08/22')
    expect(result).toEqual(expectedResult)
  })

  test('daylight savings', async () => {
    const expectedResult = [
      'firehose/2022/11/20/23',
      'firehose/2022/11/21/00',
      'firehose/2022/11/21/01',
      'firehose/2022/11/21/02',
      'firehose/2022/11/21/03',
      'firehose/2022/11/21/04',
      'firehose/2022/11/21/05',
      'firehose/2022/11/21/06',
      'firehose/2022/11/21/07',
      'firehose/2022/11/21/08',
      'firehose/2022/11/21/09',
      'firehose/2022/11/21/10',
      'firehose/2022/11/21/11',
      'firehose/2022/11/21/12',
      'firehose/2022/11/21/13',
      'firehose/2022/11/21/14',
      'firehose/2022/11/21/15',
      'firehose/2022/11/21/16',
      'firehose/2022/11/21/17',
      'firehose/2022/11/21/18',
      'firehose/2022/11/21/19',
      'firehose/2022/11/21/20',
      'firehose/2022/11/21/21',
      'firehose/2022/11/21/22',
      'firehose/2022/11/21/23',
      'firehose/2022/11/22/00'
    ]

    const result = getObjectPrefixes('2022/11/21', '2022/11/21')
    expect(result).toEqual(expectedResult)
  })

  test('invalid date string', () => {
    expect(() => {
      getObjectPrefixes('invalid', 'invalid')
    }).toThrow('String not valid date')
  })

  test('end date before start date', () => {
    expect(() => {
      getObjectPrefixes('2022/11/21', '2022/11/20')
    }).toThrow('End date before start date')
  })
})

describe('check objects in analysis bucket', () => {
  test('all data in analysis bucket', async () => {
    mocklistS3Objects
      .mockResolvedValueOnce([
        'example-object-1',
        'example-object-2',
        'example-object-3'
      ])
      .mockResolvedValueOnce([
        'example-object-1',
        'example-object-2',
        'example-object-3'
      ])

    const result = await getObjectsToCopy(
      ['prefixes'],
      'auditBucket',
      'analysisBucket'
    )
    expect(result).toEqual([])
  })

  test('no data in analysis bucket', async () => {
    mocklistS3Objects
      .mockResolvedValueOnce([
        'example-object-1',
        'example-object-2',
        'example-object-3'
      ])
      .mockResolvedValueOnce([])

    const result = await getObjectsToCopy(
      ['prefixes'],
      'auditBucket',
      'analysisBucket'
    )
    expect(result).toEqual([
      'example-object-1',
      'example-object-2',
      'example-object-3'
    ])
  })

  test('partial data in analysis bucket', async () => {
    mocklistS3Objects
      .mockResolvedValueOnce([
        'example-object-1',
        'example-object-2',
        'example-object-3'
      ])
      .mockResolvedValueOnce(['example-object-1'])

    const result = await getObjectsToCopy(
      ['prefixes'],
      'auditBucket',
      'analysisBucket'
    )
    expect(result).toEqual(['example-object-2', 'example-object-3'])
  })
})
