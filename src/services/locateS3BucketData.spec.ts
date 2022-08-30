import { getObjectPrefixes, getObjectsToCopy } from './locateS3BucketData'
import { listS3Objects } from './listS3Objects'

jest.mock('./listS3Objects', () => ({
  listS3Objects: jest.fn()
}))
const mocklistS3Objects = listS3Objects as jest.Mock<Promise<string[]>>

describe('object prefixes', () => {
  test('dates on same day', () => {
    const expectedResult = [
      '2022/08/20/23',
      '2022/08/21/00',
      '2022/08/21/01',
      '2022/08/21/02',
      '2022/08/21/03',
      '2022/08/21/04',
      '2022/08/21/05',
      '2022/08/21/06',
      '2022/08/21/07',
      '2022/08/21/08',
      '2022/08/21/09',
      '2022/08/21/10',
      '2022/08/21/11',
      '2022/08/21/12',
      '2022/08/21/13',
      '2022/08/21/14',
      '2022/08/21/15',
      '2022/08/21/16',
      '2022/08/21/17',
      '2022/08/21/18',
      '2022/08/21/19',
      '2022/08/21/20',
      '2022/08/21/21',
      '2022/08/21/22',
      '2022/08/21/23',
      '2022/08/22/00'
    ]

    const result = getObjectPrefixes('2022/08/21', '2022/08/21')
    expect(result).toEqual(expectedResult)
  })

  test('dates on different days', async () => {
    const expectedResult = [
      '2022/08/20/23',
      '2022/08/21/00',
      '2022/08/21/01',
      '2022/08/21/02',
      '2022/08/21/03',
      '2022/08/21/04',
      '2022/08/21/05',
      '2022/08/21/06',
      '2022/08/21/07',
      '2022/08/21/08',
      '2022/08/21/09',
      '2022/08/21/10',
      '2022/08/21/11',
      '2022/08/21/12',
      '2022/08/21/13',
      '2022/08/21/14',
      '2022/08/21/15',
      '2022/08/21/16',
      '2022/08/21/17',
      '2022/08/21/18',
      '2022/08/21/19',
      '2022/08/21/20',
      '2022/08/21/21',
      '2022/08/21/22',
      '2022/08/21/23',
      '2022/08/22/00',
      '2022/08/22/01',
      '2022/08/22/02',
      '2022/08/22/03',
      '2022/08/22/04',
      '2022/08/22/05',
      '2022/08/22/06',
      '2022/08/22/07',
      '2022/08/22/08',
      '2022/08/22/09',
      '2022/08/22/10',
      '2022/08/22/11',
      '2022/08/22/12',
      '2022/08/22/13',
      '2022/08/22/14',
      '2022/08/22/15',
      '2022/08/22/16',
      '2022/08/22/17',
      '2022/08/22/18',
      '2022/08/22/19',
      '2022/08/22/20',
      '2022/08/22/21',
      '2022/08/22/22',
      '2022/08/22/23',
      '2022/08/23/00'
    ]

    const result = getObjectPrefixes('2022/08/21', '2022/08/22')
    expect(result).toEqual(expectedResult)
  })

  test('daylight savings', async () => {
    const expectedResult = [
      '2022/11/20/23',
      '2022/11/21/00',
      '2022/11/21/01',
      '2022/11/21/02',
      '2022/11/21/03',
      '2022/11/21/04',
      '2022/11/21/05',
      '2022/11/21/06',
      '2022/11/21/07',
      '2022/11/21/08',
      '2022/11/21/09',
      '2022/11/21/10',
      '2022/11/21/11',
      '2022/11/21/12',
      '2022/11/21/13',
      '2022/11/21/14',
      '2022/11/21/15',
      '2022/11/21/16',
      '2022/11/21/17',
      '2022/11/21/18',
      '2022/11/21/19',
      '2022/11/21/20',
      '2022/11/21/21',
      '2022/11/21/22',
      '2022/11/21/23',
      '2022/11/22/00'
    ]

    const result = getObjectPrefixes('2022/11/21', '2022/11/21')
    expect(result).toEqual(expectedResult)
  })

  test('invalid date string', () => {
    expect(() => {
      getObjectPrefixes('invalid', 'invalid')
    }).toThrow('Invalid dates received')
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
