import { mockClient } from 'aws-sdk-client-mock'
import { listS3ObjectVersions } from './listS3ObjectVersions'
import {
  S3Client,
  ListObjectVersionsCommand,
  ListObjectVersionsCommandInput
} from '@aws-sdk/client-s3'

const s3Mock = mockClient(S3Client)

describe('list S3 objects', () => {
  const input: ListObjectVersionsCommandInput = {
    Bucket: 'example-bucket'
  }

  beforeEach(() => {
    s3Mock.reset()
  })

  test('response has no delete markers or versions', async () => {
    s3Mock.on(ListObjectVersionsCommand).resolves({})

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({ deleteMarkers: [], versions: [] })
  })

  test('response has no delete markers but does have versions', async () => {
    s3Mock.on(ListObjectVersionsCommand).resolves({
      Versions: [{ Key: 'version-1' }]
    })

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({ deleteMarkers: [], versions: ['version-1'] })
  })

  test('response has no versions but does have delete markers', async () => {
    s3Mock.on(ListObjectVersionsCommand).resolves({
      DeleteMarkers: [{ Key: 'version-1' }]
    })

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({ deleteMarkers: ['version-1'], versions: [] })
  })

  test('response has versions and delete markers', async () => {
    s3Mock.on(ListObjectVersionsCommand).resolves({
      DeleteMarkers: [{ Key: 'version-1' }],
      Versions: [{ Key: 'version-1' }]
    })

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({
      deleteMarkers: ['version-1'],
      versions: ['version-1']
    })
  })

  test('response has NextKeyMarker', async () => {
    s3Mock
      .on(ListObjectVersionsCommand)
      .resolvesOnce({
        DeleteMarkers: [{ Key: 'version-1' }],
        IsTruncated: true,
        NextKeyMarker: 'page-2'
      })
      .resolves({
        DeleteMarkers: [{ Key: 'version-2' }]
      })

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({
      deleteMarkers: ['version-1', 'version-2'],
      versions: []
    })
  })

  test('response has NextVersionIdMarker', async () => {
    s3Mock
      .on(ListObjectVersionsCommand)
      .resolvesOnce({
        IsTruncated: true,
        NextVersionIdMarker: 'page-2',
        Versions: [{ Key: 'version-1' }]
      })
      .resolves({
        Versions: [{ Key: 'version-2' }]
      })

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({
      deleteMarkers: [],
      versions: ['version-1', 'version-2']
    })
  })

  test('response has both NextKeyMarker and NextVersionIdMarker', async () => {
    s3Mock
      .on(ListObjectVersionsCommand)
      .resolvesOnce({
        DeleteMarkers: [{ Key: 'version-1' }],
        IsTruncated: true,
        NextKeyMarker: 'page-2',
        NextVersionIdMarker: 'page-2',
        Versions: [{ Key: 'version-1' }]
      })
      .resolves({
        DeleteMarkers: [{ Key: 'version-2' }],
        Versions: [{ Key: 'version-2' }]
      })

    const result = await listS3ObjectVersions(input)
    expect(result).toEqual({
      deleteMarkers: ['version-1', 'version-2'],
      versions: ['version-1', 'version-2']
    })
  })
})
