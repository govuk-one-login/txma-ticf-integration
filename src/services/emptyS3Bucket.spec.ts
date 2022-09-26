import { emptyS3Bucket } from './emptyS3Bucket'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import {
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  S3Client,
  _Object
} from '@aws-sdk/client-s3'
import { listS3Files } from './listS3Files'
import { listS3ObjectVersions } from './listS3ObjectVersions'

const s3Mock = mockClient(S3Client)

jest.mock('./listS3Files', () => ({
  listS3Files: jest.fn()
}))
const mocklistS3Files = listS3Files as jest.Mock<Promise<_Object[]>>

jest.mock('./listS3ObjectVersions', () => ({
  listS3ObjectVersions: jest.fn()
}))
const mocklistS3ObjectVersions = listS3ObjectVersions as jest.Mock<
  Promise<{ deleteMarkers: string[]; versions: string[] }>
>

const bucketName = 'example-bucket'

describe('empty s3 bucket', () => {
  beforeEach(() => {
    s3Mock.reset()
    mocklistS3ObjectVersions.mockReset()
    mocklistS3Files.mockReset()
  })

  test('s3 bucket does not have versioning enabled', async () => {
    s3Mock.on(GetBucketVersioningCommand).resolves({})
    mocklistS3Files.mockResolvedValue([{ Key: 'object-1' }])
    s3Mock.on(DeleteObjectCommand).resolves({})

    await emptyS3Bucket(bucketName)
    expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
      Key: 'object-1'
    })
  })

  test('s3 bucket has versioning enabled', async () => {
    s3Mock.on(GetBucketVersioningCommand).resolves({
      Status: 'Enabled'
    })
    s3Mock.on(PutBucketVersioningCommand).resolves({})
    s3Mock.on(DeleteObjectCommand).resolves({})
    mocklistS3Files.mockResolvedValue([{ Key: 'object-1' }])
    mocklistS3ObjectVersions.mockResolvedValue({
      deleteMarkers: ['version-1'],
      versions: ['version-1']
    })

    await emptyS3Bucket(bucketName)

    expect(s3Mock).toHaveReceivedCommandWith(PutBucketVersioningCommand, {
      Bucket: bucketName,
      VersioningConfiguration: { Status: 'Suspended' }
    })
    expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectCommand, 3)
  })

  test('No objects in unversioned s3 bucket', async () => {
    s3Mock.on(GetBucketVersioningCommand).resolves({})
    mocklistS3Files.mockResolvedValue([])

    await emptyS3Bucket(bucketName)

    expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectCommand, 0)
  })

  test('No objects in versioned s3 bucket', async () => {
    s3Mock.on(GetBucketVersioningCommand).resolves({
      Status: 'Enabled'
    })
    s3Mock.on(PutBucketVersioningCommand).resolves({})
    mocklistS3Files.mockResolvedValue([])
    mocklistS3ObjectVersions.mockResolvedValue({
      deleteMarkers: [],
      versions: []
    })

    await emptyS3Bucket(bucketName)

    expect(s3Mock).toHaveReceivedCommandWith(PutBucketVersioningCommand, {
      Bucket: bucketName,
      VersioningConfiguration: { Status: 'Suspended' }
    })
    expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectCommand, 0)
  })
})
