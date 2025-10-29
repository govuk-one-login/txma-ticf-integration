const mockS3Send = jest.fn()
const mockS3ControlSend = jest.fn()

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send
  })),
  ListObjectsV2Command: jest.fn().mockImplementation((input) => input),
  PutObjectCommand: jest.fn().mockImplementation((input) => input)
}))

jest.mock('@aws-sdk/client-s3-control', () => ({
  S3ControlClient: jest.fn().mockImplementation(() => ({
    send: mockS3ControlSend
  })),
  CreateJobCommand: jest.fn().mockImplementation((input) => input)
}))

import { handler } from './handler'

describe('Glacier Migration Handler', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      ORIGINAL_BUCKET: 'original-bucket',
      RESTORED_BUCKET: 'restored-bucket',
      MANIFEST_BUCKET: 'manifest-bucket',
      BATCH_JOB_ROLE: 'arn:aws:iam::123456789012:role/batch-job-role',
      AWS_ACCOUNT_ID: '123456789012'
    }
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000)
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('should return no objects message when bucket is empty', async () => {
    mockS3Send.mockResolvedValue({ Contents: [] })

    const result = await handler()

    expect(result).toEqual({
      statusCode: 200,
      body: 'No objects to migrate'
    })
  })

  it('should create batch job for objects', async () => {
    mockS3Send
      .mockResolvedValueOnce({
        Contents: [
          { Key: 'file1.json', LastModified: new Date('2021-10-01') },
          { Key: 'file2.json', LastModified: new Date('2021-12-01') }
        ]
      })
      .mockResolvedValueOnce({}) // PutObjectCommand

    mockS3ControlSend.mockResolvedValue({ JobId: 'job-123' })

    const result = await handler()

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Batch job created',
        jobId: 'job-123',
        objectCount: 2
      })
    })
  })

  it('should handle pagination', async () => {
    mockS3Send
      .mockResolvedValueOnce({
        Contents: [{ Key: 'file1.json', LastModified: new Date() }],
        NextContinuationToken: 'token123'
      })
      .mockResolvedValueOnce({
        Contents: [{ Key: 'file2.json', LastModified: new Date() }]
      })
      .mockResolvedValueOnce({})

    mockS3ControlSend.mockResolvedValue({ JobId: 'job-456' })

    const result = await handler()

    expect(result.body).toContain('"objectCount":2')
  })

  it('should handle errors', async () => {
    mockS3Send.mockRejectedValue(new Error('S3 Error'))

    const result = await handler()

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify('Error: Error: S3 Error')
    })
  })
})
