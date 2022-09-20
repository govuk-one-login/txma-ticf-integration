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

  const givenDataInBucketForPrefixes = (
    prefixes: string[],
    bucketName: string,
    storageClass: StorageClass
  ) => {
    prefixes.forEach((prefix) => {
      when(listS3Objects)
        .calledWith({ Prefix: prefix, Bucket: bucketName })
        .mockResolvedValue(
          generateS3ObjectDataForKeys(
            [
              `${prefix}/example-object-1`,
              `${prefix}/example-object-2`,
              `${prefix}/example-object-3`
            ],
            storageClass
          )
        )
    })
  }

  const givenNoDataInBucketForPrefixes = (
    prefixes: string[],
    bucketName: string
  ) => {
    prefixes.forEach((prefix) => {
      when(listS3Objects)
        .calledWith({ Prefix: prefix, Bucket: bucketName })
        .mockResolvedValue([])
    })
  }

  const givenAllDataInBothBuckets = (prefixes: string[]) => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET, 'STANDARD')
  }

  const givenNoDataInAnalysisBucket = (prefixes: string[]) => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)
  }

  const givenPartialDataInAnalysisBucket = (prefixes: string[]) => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(
      [prefixes[0], prefixes[1]],
      TEST_ANALYSIS_BUCKET
    )
    givenDataInBucketForPrefixes(
      [prefixes[2]],
      TEST_ANALYSIS_BUCKET,
      'STANDARD'
    )
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

  test('no data in analysis bucket, all audit data is standard tier', async () => {
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

  // test('no data in analysis bucket, all audit data is glacier tier')

  // test('no data in analysis bucket, some audit data is glacier tier')

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
