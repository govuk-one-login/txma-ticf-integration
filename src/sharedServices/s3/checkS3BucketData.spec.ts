import { listS3Files } from './listS3Files'
import { checkS3BucketData } from './checkS3BucketData'
import { generateS3ObjectPrefixesForDateList } from './generateS3ObjectPrefixesForDateList'
import { StorageClass, _Object } from '@aws-sdk/client-s3'
import { when } from 'jest-when'
import {
  TEST_ANALYSIS_BUCKET,
  TEST_AUDIT_BUCKET,
  TEST_DATE_1,
  TEST_DATE_2,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { logger } from '../logger'
jest.mock('./listS3Files', () => ({
  listS3Files: jest.fn()
}))

jest.mock('./generateS3ObjectPrefixesForDateList', () => ({
  generateS3ObjectPrefixesForDateList: jest.fn()
}))
const mockgenerateS3ObjectPrefixesForDateList =
  generateS3ObjectPrefixesForDateList as jest.Mock<string[]>

describe('check objects in analysis bucket', () => {
  const prefixes = [
    'firehose/2022/10/10/21',
    'firehose/2022/10/10/22',
    'firehose/2022/10/10/23'
  ]
  mockgenerateS3ObjectPrefixesForDateList.mockReturnValue(prefixes)
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

  const givenDataInBucketForPrefix = (
    prefix: string,
    bucketName: string,
    objects: _Object[]
  ) => {
    when(listS3Files)
      .calledWith({ Prefix: prefix, Bucket: bucketName })
      .mockResolvedValue(objects)
  }

  const givenDataInBucketForPrefixes = (
    prefixes: string[],
    bucketName: string,
    storageClass: StorageClass
  ) => {
    prefixes.forEach((prefix) => {
      givenDataInBucketForPrefix(
        prefix,
        bucketName,
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
      when(listS3Files)
        .calledWith({ Prefix: prefix, Bucket: bucketName })
        .mockResolvedValue([])
    })
  }

  const givenNoDataInEitherBucket = () => {
    when(listS3Files).defaultResolvedValue([])
  }

  beforeEach(() => {
    when(listS3Files).resetWhenMocks()
    jest.spyOn(logger, 'info')
    jest.spyOn(logger, 'warn')
  })

  const assertNumberOfFilesLogged = (
    standardTierFiles: number,
    glacierTierFiles: number
  ) => {
    expect(logger.info).toHaveBeenLastCalledWith(
      `Number of standard tier files to copy was ${standardTierFiles}, glacier tier files to copy was ${glacierTierFiles}`
    )
  }

  const assertFilesMissingKeysLogged = (bucketName: string) => {
    expect(logger.warn).toHaveBeenLastCalledWith(
      `Some data in the bucket '${bucketName}' had missing keys, which have been ignored. ZendeskId: '${ZENDESK_TICKET_ID}', dates '${TEST_DATE_1},${TEST_DATE_2}'.`
    )
  }

  const assertFilesMissingStorageClassLogged = (bucketName: string) => {
    expect(logger.warn).toHaveBeenLastCalledWith(
      `Some data in the bucket '${bucketName}' had missing storage class, and these have been ignored. ZendeskId: '${ZENDESK_TICKET_ID}', dates '${TEST_DATE_1},${TEST_DATE_2}'.`
    )
  }

  test('all data in analysis bucket', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET, 'STANDARD')

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: []
    })
    assertNumberOfFilesLogged(0, 0)
  })

  test('all data in analysis bucket', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET, 'STANDARD')

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: []
    })
    assertNumberOfFilesLogged(0, 0)
  })

  test('no data in analysis bucket, all audit data is standard tier', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)

    const result = await checkS3BucketData(testDataRequest)
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
    assertNumberOfFilesLogged(9, 0)
  })

  test('no data in analysis bucket, audit bucket data contains some data with missing keys', async () => {
    givenDataInBucketForPrefixes(
      [prefixes[0], prefixes[2]],
      TEST_AUDIT_BUCKET,
      'STANDARD'
    )
    givenDataInBucketForPrefix(prefixes[1], TEST_AUDIT_BUCKET, [
      { StorageClass: 'STANDARD' }
    ])
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ]
    })
    assertNumberOfFilesLogged(6, 0)
    assertFilesMissingKeysLogged(TEST_AUDIT_BUCKET)
  })

  test('no data in analysis bucket, audit bucket data contains some data with undefined keys', async () => {
    givenDataInBucketForPrefixes(
      [prefixes[0], prefixes[2]],
      TEST_AUDIT_BUCKET,
      'STANDARD'
    )
    givenDataInBucketForPrefix(prefixes[1], TEST_AUDIT_BUCKET, [
      { StorageClass: 'STANDARD', Key: undefined }
    ])
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ]
    })
    assertNumberOfFilesLogged(6, 0)
    assertFilesMissingKeysLogged(TEST_AUDIT_BUCKET)
  })

  test('no data in analysis bucket, audit bucket data contains some data with missing storage class', async () => {
    givenDataInBucketForPrefixes(
      [prefixes[0], prefixes[2]],
      TEST_AUDIT_BUCKET,
      'STANDARD'
    )
    givenDataInBucketForPrefix(prefixes[1], TEST_AUDIT_BUCKET, [
      { Key: 'firehose/2022/10/10/22/example-object-1' }
    ])
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ]
    })
    assertNumberOfFilesLogged(6, 0)
    assertFilesMissingStorageClassLogged(TEST_AUDIT_BUCKET)
  })

  test('no data in analysis bucket, audit bucket data contains some data with undefined storage class', async () => {
    givenDataInBucketForPrefixes(
      [prefixes[0], prefixes[2]],
      TEST_AUDIT_BUCKET,
      'STANDARD'
    )
    givenDataInBucketForPrefix(prefixes[1], TEST_AUDIT_BUCKET, [
      {
        Key: 'firehose/2022/10/10/22/example-object-1',
        StorageClass: undefined
      }
    ])
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ]
    })
    assertNumberOfFilesLogged(6, 0)
    assertFilesMissingStorageClassLogged(TEST_AUDIT_BUCKET)
  })

  test('no data in analysis bucket, all audit data in glacier tier', async () => {
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'GLACIER')

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/22/example-object-1',
        'firehose/2022/10/10/22/example-object-2',
        'firehose/2022/10/10/22/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ],
      standardTierLocationsToCopy: []
    })
    assertNumberOfFilesLogged(0, 9)
  })

  test('no data in analysis bucket, some audit data in glacier tier', async () => {
    givenNoDataInBucketForPrefixes(prefixes, TEST_ANALYSIS_BUCKET)
    givenDataInBucketForPrefixes(
      [prefixes[0], prefixes[2]],
      TEST_AUDIT_BUCKET,
      'GLACIER'
    )
    givenDataInBucketForPrefixes([prefixes[1]], TEST_AUDIT_BUCKET, 'STANDARD')
    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: true,
      glacierTierLocationsToCopy: [
        'firehose/2022/10/10/21/example-object-1',
        'firehose/2022/10/10/21/example-object-2',
        'firehose/2022/10/10/21/example-object-3',
        'firehose/2022/10/10/23/example-object-1',
        'firehose/2022/10/10/23/example-object-2',
        'firehose/2022/10/10/23/example-object-3'
      ],
      standardTierLocationsToCopy: [
        'firehose/2022/10/10/22/example-object-1',
        'firehose/2022/10/10/22/example-object-2',
        'firehose/2022/10/10/22/example-object-3'
      ]
    })
    assertNumberOfFilesLogged(3, 6)
  })

  test('partial data in analysis bucket', async () => {
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

    const result = await checkS3BucketData(testDataRequest)
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
    assertNumberOfFilesLogged(6, 0)
  })

  test('partial data in analysis bucket, some data in analysis bucket missing keys', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(
      [prefixes[0], prefixes[1]],
      TEST_ANALYSIS_BUCKET
    )
    givenDataInBucketForPrefix(prefixes[2], TEST_ANALYSIS_BUCKET, [
      { StorageClass: 'STANDARD' },
      {
        Key: 'firehose/2022/10/10/23/example-object-2',
        StorageClass: 'STANDARD'
      },
      {
        Key: 'firehose/2022/10/10/23/example-object-3',
        StorageClass: 'STANDARD'
      }
    ])

    const result = await checkS3BucketData(testDataRequest)
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
        'firehose/2022/10/10/23/example-object-1'
      ]
    })
    assertNumberOfFilesLogged(7, 0)
    assertFilesMissingKeysLogged(TEST_ANALYSIS_BUCKET)
  })

  test('partial data in analysis bucket, some data in analysis bucket with undefined keys', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(
      [prefixes[0], prefixes[1]],
      TEST_ANALYSIS_BUCKET
    )
    givenDataInBucketForPrefix(prefixes[2], TEST_ANALYSIS_BUCKET, [
      { StorageClass: 'STANDARD', Key: undefined },
      {
        Key: 'firehose/2022/10/10/23/example-object-2',
        StorageClass: 'STANDARD'
      },
      {
        Key: 'firehose/2022/10/10/23/example-object-3',
        StorageClass: 'STANDARD'
      }
    ])

    const result = await checkS3BucketData(testDataRequest)
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
        'firehose/2022/10/10/23/example-object-1'
      ]
    })
    assertNumberOfFilesLogged(7, 0)
    assertFilesMissingKeysLogged(TEST_ANALYSIS_BUCKET)
  })

  test('partial data in analysis bucket, some data in analysis bucket missing storage class', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(
      [prefixes[0], prefixes[1]],
      TEST_ANALYSIS_BUCKET
    )
    givenDataInBucketForPrefix(prefixes[2], TEST_ANALYSIS_BUCKET, [
      { Key: 'firehose/2022/10/10/23/example-object-1' },
      {
        Key: 'firehose/2022/10/10/23/example-object-2',
        StorageClass: 'STANDARD'
      },
      {
        Key: 'firehose/2022/10/10/23/example-object-3',
        StorageClass: 'STANDARD'
      }
    ])

    const result = await checkS3BucketData(testDataRequest)
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
        'firehose/2022/10/10/23/example-object-1'
      ]
    })
    assertNumberOfFilesLogged(7, 0)
    assertFilesMissingStorageClassLogged(TEST_ANALYSIS_BUCKET)
  })

  test('partial data in analysis bucket, some data in analysis bucket with undefined storage class', async () => {
    givenDataInBucketForPrefixes(prefixes, TEST_AUDIT_BUCKET, 'STANDARD')
    givenNoDataInBucketForPrefixes(
      [prefixes[0], prefixes[1]],
      TEST_ANALYSIS_BUCKET
    )
    givenDataInBucketForPrefix(prefixes[2], TEST_ANALYSIS_BUCKET, [
      {
        Key: 'firehose/2022/10/10/23/example-object-1',
        StorageClass: undefined
      },
      {
        Key: 'firehose/2022/10/10/23/example-object-2',
        StorageClass: 'STANDARD'
      },
      {
        Key: 'firehose/2022/10/10/23/example-object-3',
        StorageClass: 'STANDARD'
      }
    ])

    const result = await checkS3BucketData(testDataRequest)
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
        'firehose/2022/10/10/23/example-object-1'
      ]
    })
    assertNumberOfFilesLogged(7, 0)
    assertFilesMissingStorageClassLogged(TEST_ANALYSIS_BUCKET)
  })

  test('no data in either bucket', async () => {
    givenNoDataInEitherBucket()

    const result = await checkS3BucketData(testDataRequest)
    expect(result).toEqual({
      dataAvailable: false,
      glacierTierLocationsToCopy: [],
      standardTierLocationsToCopy: []
    })
    assertNumberOfFilesLogged(0, 0)
  })
})
