import { listS3Objects } from './listS3Objects'
import { checkS3BucketData } from './checkS3BucketData'
import { generateS3ObjectPrefixes } from './generateS3ObjectPrefixes'
import { DataRequestParams } from '../types/dataRequestParams'
import { StorageClass, _Object } from '@aws-sdk/client-s3'
import { when } from 'jest-when'
import {
  TEST_ANALYSIS_BUCKET,
  TEST_AUDIT_BUCKET
} from '../utils/tests/testConstants'
jest.mock('./listS3Objects', () => ({
  listS3Objects: jest.fn()
}))
//const mocklistS3Objects = listS3Objects as jest.Mock<Promise<_Object[]>>

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
  const generateS3ObjectDataForKey = (
    key: string,
    storageClass: StorageClass
  ): _Object => ({
    Key: key,
    StorageClass: storageClass
  })

  const generateS3ObjectDataForKeys = (
    keys: string[],
    storageClass: StorageClass
  ): _Object[] => keys.map((k) => generateS3ObjectDataForKey(k, storageClass))

  const givenAllDataInBothBuckets = (prefixes: string[]) => {
    prefixes.forEach((prefix) =>
      when(listS3Objects)
        .calledWith({ Prefix: prefix, Bucket: TEST_AUDIT_BUCKET })
        .mockResolvedValue(
          generateS3ObjectDataForKeys(
            [
              `${prefix}/example-object-1`,
              `${prefix}/example-object-2`,
              `${prefix}/example-object-3`
            ],
            'STANDARD'
          )
        )
    )

    prefixes.forEach((prefix) =>
      when(listS3Objects)
        .calledWith({ Prefix: prefix, Bucket: TEST_ANALYSIS_BUCKET })
        .mockResolvedValue(
          generateS3ObjectDataForKeys(
            [
              `${prefix}/example-object-1`,
              `${prefix}/example-object-2`,
              `${prefix}/example-object-3`
            ],
            'STANDARD'
          )
        )
    )
  }

  const givenNoDataInAnalysisBucket = (prefixes: string[]) => {
    prefixes.forEach((prefix) => {
      when(listS3Objects)
        .calledWith({ Prefix: prefix, Bucket: TEST_AUDIT_BUCKET })
        .mockResolvedValue(
          generateS3ObjectDataForKeys(
            [
              `${prefix}/example-object-1`,
              `${prefix}/example-object-2`,
              `${prefix}/example-object-3`
            ],
            'STANDARD'
          )
        )

      when(listS3Objects)
        .calledWith({ Prefix: prefix, Bucket: TEST_ANALYSIS_BUCKET })
        .mockResolvedValue([])
    })
  }

  const givenPartialDataInAnalysisBucket = (prefixes: string[]) => {
    prefixes.forEach((prefix) => {
      when(listS3Objects)
        .calledWith({ Bucket: TEST_AUDIT_BUCKET, Prefix: prefix })
        .mockResolvedValue(
          generateS3ObjectDataForKeys(
            [
              `${prefix}/example-object-1`,
              `${prefix}/example-object-2`,
              `${prefix}/example-object-3`
            ],
            'STANDARD'
          )
        )

      prefixes.forEach((prefix, index) => {
        if (index <= 1) {
          when(listS3Objects)
            .calledWith({ Prefix: prefix, Bucket: TEST_ANALYSIS_BUCKET })
            .mockResolvedValue([])
        }
        if (index > 1) {
          when(listS3Objects)
            .calledWith({ Prefix: prefix, Bucket: TEST_ANALYSIS_BUCKET })
            .mockResolvedValue(
              generateS3ObjectDataForKeys(
                [
                  `${prefix}/example-object-1`,
                  `${prefix}/example-object-2`,
                  `${prefix}/example-object-3`
                ],
                'STANDARD'
              )
            )
        }
      })
    })
  }

  const givenNoDataInEitherBucket = () => {
    when(listS3Objects).defaultResolvedValue([])
  }

  beforeEach(() => {
    when(listS3Objects).resetWhenMocks()
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
      dataAvailable: false,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: []
    })
  })
})
