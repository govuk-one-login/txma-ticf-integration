import { mockClient } from 'aws-sdk-client-mock'
import { listS3Objects } from './listS3Objects'
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

    const result = await listS3Objects(input)
    expect(result).toEqual(['example-object'])
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
    const result = await listS3Objects(input)
    expect(result).toEqual([
      'example-object-1',
      'example-object-2',
      'example-object-3'
    ])
  })

  test('response has no next continuation token - no more pages after the current', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'example-object' }],
      ContinuationToken: 'page2'
    })

    const result = await listS3Objects(input)
    expect(result).toEqual(['example-object'])
  })

  test('response has no continuation token or contents', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({})

    const result = await listS3Objects(input)
    expect(result).toEqual([])
  })
})
