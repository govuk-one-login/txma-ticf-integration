import { listS3Objects } from './listS3Objects'
import { checkS3BucketData } from './checkS3BucketData'
import { generateS3ObjectPrefixes } from './generateS3ObjectPrefixes'
import { DataRequestParams } from '../types/dataRequestParams'

jest.mock('./listS3Objects', () => ({
  listS3Objects: jest.fn()
}))
const mocklistS3Objects = listS3Objects as jest.Mock<Promise<string[]>>

jest.mock('./generateS3ObjectPrefixes', () => ({
  generateS3ObjectPrefixes: jest.fn()
}))
const mockgenerateS3ObjectPrefixes = generateS3ObjectPrefixes as jest.Mock<
  string[]
>

const mockDataRequestParams: DataRequestParams = {
  dateFrom: '2022/10/10',
  dateTo: '2022/10/10',
  zendeskId: '123',
  resultsEmail: 'test@gov.uk',
  resultsName: 'test name',
  identifierType: 'event_id'
}

describe('check objects in analysis bucket', () => {
  const prefixes = [
    'firehose/2022/10/10/21',
    'firehose/2022/10/10/22',
    'firehose/2022/10/10/23'
  ]
  mockgenerateS3ObjectPrefixes.mockReturnValue(prefixes)

  const givenAllDataInBothBuckets = (prefixes: string[]) => {
    prefixes.forEach((prefix) => {
      mocklistS3Objects.mockResolvedValueOnce([
        `${prefix}/example-object-1`,
        `${prefix}/example-object-2`,
        `${prefix}/example-object-3`
      ])
    })

    prefixes.forEach((prefix) => {
      mocklistS3Objects.mockResolvedValueOnce([
        `${prefix}/example-object-1`,
        `${prefix}/example-object-2`,
        `${prefix}/example-object-3`
      ])
    })
  }

  const givenNoDataInAnalysisBucket = (prefixes: string[]) => {
    prefixes.forEach((prefix) => {
      mocklistS3Objects
        .mockResolvedValueOnce([
          `${prefix}/example-object-1`,
          `${prefix}/example-object-2`,
          `${prefix}/example-object-3`
        ])
        .mockResolvedValue([])
    })
  }

  const givenPartialDataInAnalysisBucket = (prefixes: string[]) => {
    prefixes.forEach((prefix) => {
      mocklistS3Objects.mockResolvedValueOnce([
        `${prefix}/example-object-1`,
        `${prefix}/example-object-2`,
        `${prefix}/example-object-3`
      ])

      prefixes.forEach((prefix, index) => {
        if (index > 1) {
          mocklistS3Objects.mockResolvedValueOnce([
            `${prefix}/example-object-1`,
            `${prefix}/example-object-2`,
            `${prefix}/example-object-3`
          ])
        }
      })
    })
  }

  const givenNoDataInEitherBucket = () => {
    mocklistS3Objects.mockResolvedValue([])
  }

  beforeEach(() => {
    mocklistS3Objects.mockReset()
  })

  test('all data in analysis bucket', async () => {
    givenAllDataInBothBuckets(prefixes)

    const result = await checkS3BucketData(mockDataRequestParams)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: []
    })
  })

  test('no data in analysis bucket', async () => {
    givenNoDataInAnalysisBucket(prefixes)

    const result = await checkS3BucketData(mockDataRequestParams)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/22/example-object-1',
        'firehose/2022/10/10/22/example-object-2',
        'firehose/2022/10/10/22/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ]
    })
  })

  test('partial data in analysis bucket', async () => {
    givenPartialDataInAnalysisBucket(prefixes)

    mocklistS3Objects
      .mockResolvedValueOnce([
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3'
      ])
      .mockResolvedValueOnce(['firehose/2022/10/10/21/example-object-1'])

    const result = await checkS3BucketData(mockDataRequestParams)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/22/example-object-1',
        'firehose/2022/10/10/22/example-object-2',
        'firehose/2022/10/10/22/example-object-3'
      ]
    })
  })

  test('no data in either bucket', async () => {
    givenNoDataInEitherBucket()

    const result = await checkS3BucketData(mockDataRequestParams)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: []
    })
  })
})
