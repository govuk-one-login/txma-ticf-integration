import { mockClient } from 'aws-sdk-client-mock'
import { listS3Files } from './listS3Files'
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandInput
} from '@aws-sdk/client-s3'

const s3Mock = mockClient(S3Client)

describe('list S3 objects', () => {
  const input: ListObjectsV2CommandInput = {
    Bucket: 'example-bucket'
  }

  beforeEach(() => {
    s3Mock.reset()
  })

  test('response has no continuation token - only 1 page of results', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'example-object' }]
    })

    const result = await listS3Files(input)
    expect(result).toEqual([{ Key: 'example-object' }])
  })

  test('folders in the output are ignored', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: 'example-folder/' },
        { Key: 'example-folder/example-file' }
      ]
    })

    const result = await listS3Files(input)
    expect(result).toEqual([{ Key: 'example-folder/example-file' }])
  })

  test('response has continuation token - return results for all pages', async () => {
    s3Mock
      .on(ListObjectsV2Command)
      .resolvesOnce({
        Contents: [{ Key: 'example-object-1' }],
        ContinuationToken: 'page1',
        NextContinuationToken: 'page2'
      })
      .resolvesOnce({
        Contents: [{ Key: 'example-object-2' }],
        ContinuationToken: 'page2',
        NextContinuationToken: 'page3'
      })
      .resolves({
        Contents: [{ Key: 'example-object-3' }],
        ContinuationToken: 'page3'
      })
    const result = await listS3Files(input)
    expect(result).toEqual([
      { Key: 'example-object-1' },
      { Key: 'example-object-2' },
      { Key: 'example-object-3' }
    ])
  })

  test('response has no next continuation token - no more pages after the current', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'example-object' }],
      ContinuationToken: 'page2'
    })

    const result = await listS3Files(input)
    expect(result).toEqual([{ Key: 'example-object' }])
  })

  test('response has no continuation token or contents', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({})

    const result = await listS3Files(input)
    expect(result).toEqual([])
  })
})
