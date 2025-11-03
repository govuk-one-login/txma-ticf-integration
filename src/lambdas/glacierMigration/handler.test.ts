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

  it('should create separate batch jobs for different storage classes', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 100) // > 90 days old
    const newDate = new Date()
    newDate.setDate(newDate.getDate() - 30) // < 90 days old

    mockS3Send
      .mockResolvedValueOnce({
        Contents: [
          { Key: 'old-file.json', LastModified: oldDate },
          { Key: 'new-file.json', LastModified: newDate }
        ]
      })
      .mockResolvedValueOnce({}) // PutObjectCommand for STANDARD
      .mockResolvedValueOnce({}) // PutObjectCommand for GLACIER_IR

    mockS3ControlSend
      .mockResolvedValueOnce({ JobId: 'standard-job-123' })
      .mockResolvedValueOnce({ JobId: 'glacier-job-456' })

    const result = await handler()

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Batch jobs created',
        jobIds: ['standard-job-123', 'glacier-job-456'],
        objectCount: 2,
        standardCount: 1,
        glacierCount: 1
      })
    })
  })

  it('should handle pagination', async () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 30) // Recent files < 90 days

    mockS3Send
      .mockResolvedValueOnce({
        Contents: [{ Key: 'file1.json', LastModified: recentDate }],
        NextContinuationToken: 'token123'
      })
      .mockResolvedValueOnce({
        Contents: [{ Key: 'file2.json', LastModified: recentDate }]
      })
      .mockResolvedValueOnce({}) // PutObjectCommand for STANDARD

    mockS3ControlSend.mockResolvedValue({ JobId: 'job-456' })

    const result = await handler()

    expect(result.body).toContain('"objectCount":2')
    expect(result.body).toContain('"standardCount":2')
    expect(result.body).toContain('"glacierCount":0')
  })

  it('should handle only old files', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 100) // > 90 days old

    mockS3Send
      .mockResolvedValueOnce({
        Contents: [
          { Key: 'old-file1.json', LastModified: oldDate },
          { Key: 'old-file2.json', LastModified: oldDate }
        ]
      })
      .mockResolvedValueOnce({}) // PutObjectCommand for GLACIER_IR

    mockS3ControlSend.mockResolvedValue({ JobId: 'glacier-job-789' })

    const result = await handler()

    expect(result.body).toContain('"jobIds":["glacier-job-789"]')
    expect(result.body).toContain('"standardCount":0')
    expect(result.body).toContain('"glacierCount":2')
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
