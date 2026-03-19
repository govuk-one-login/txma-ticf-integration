import { vi } from 'vitest'
import {
  TEST_ANALYSIS_BUCKET,
  TEST_PERMANENT_BUCKET_NAME,
  TEST_S3_BATCH_TASK_ID,
  TEST_S3_OBJECT_DATA_BUFFER,
  TEST_S3_OBJECT_DATA_STRING,
  TEST_S3_OBJECT_KEY
} from '../../../common/utils/tests/testConstants'
import { createDataStream } from '../../../common/utils/tests/testHelpers'
import { getS3ObjectAsStream } from '../../../common/sharedServices/s3/getS3ObjectAsStream'
import { decryptS3Object } from './decryptS3Object'
import { putS3Object } from '../../../common/sharedServices/s3/putS3Object'
import {
  testS3BatchEvent,
  emptyTestS3BatchEvent
} from '../../../common/utils/tests/events/s3BatchEvent'
import { handler } from './handler'
import { mockLambdaContext } from '../../../common/utils/tests/mocks/mockLambdaContext'
import { logger } from '../../../common/sharedServices/logger'

vi.mock('../../../common/sharedServices/s3/getS3ObjectAsStream', () => ({
  getS3ObjectAsStream: vi.fn()
}))
vi.mock('./decryptS3Object', () => ({
  decryptS3Object: vi.fn()
}))
vi.mock('../../../common/sharedServices/s3/putS3Object', () => ({
  putS3Object: vi.fn()
}))

const mockGetS3ObjectAsStream = vi.mocked(getS3ObjectAsStream)
const mockDecryptS3Object = vi.mocked(decryptS3Object)
const mockPutS3Object = vi.mocked(putS3Object)

describe('DecryptAndCopy', function () {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(logger, 'error')
    process.env.ANALYSIS_BUCKET_NAME = TEST_ANALYSIS_BUCKET
  })

  const givenS3DataAvailable = () => {
    const s3ObjectStream = createDataStream(TEST_S3_OBJECT_DATA_STRING)
    mockGetS3ObjectAsStream.mockResolvedValue(s3ObjectStream)
    mockDecryptS3Object.mockResolvedValue(TEST_S3_OBJECT_DATA_BUFFER)
    return s3ObjectStream
  }

  it('retrieves, decrypts and copies an S3 object', async () => {
    const s3ObjectStream = givenS3DataAvailable()

    const response = await handler(testS3BatchEvent, mockLambdaContext)
    expect(response.results[0].taskId).toEqual(TEST_S3_BATCH_TASK_ID)
    expect(response.results[0].resultCode).toEqual('Succeeded')
    expect(mockGetS3ObjectAsStream).toHaveBeenCalledWith(
      TEST_PERMANENT_BUCKET_NAME,
      TEST_S3_OBJECT_KEY
    )
    expect(mockDecryptS3Object).toHaveBeenCalledWith(s3ObjectStream)
    expect(mockPutS3Object).toHaveBeenCalledWith(
      TEST_ANALYSIS_BUCKET,
      TEST_S3_OBJECT_KEY,
      TEST_S3_OBJECT_DATA_BUFFER
    )
  })

  it('catches and logs errors, and marks the operation as a temporary failure', async () => {
    const s3ObjectStream = createDataStream(TEST_S3_OBJECT_DATA_STRING)
    mockGetS3ObjectAsStream.mockResolvedValue(s3ObjectStream)
    mockDecryptS3Object.mockResolvedValue(TEST_S3_OBJECT_DATA_BUFFER)
    vi.mocked(decryptS3Object).mockRejectedValue('Some decryption error')
    const response = await handler(testS3BatchEvent, mockLambdaContext)
    expect(response.results[0].resultCode).toEqual('TemporaryFailure')
    expect(logger.error).toHaveBeenCalledWith('Error during decrypt and copy', {
      err: 'Some decryption error',
      s3Key: TEST_S3_OBJECT_KEY
    })
  })

  it('throws an error if there is no data in the SQS Event', async () => {
    await expect(
      handler(emptyTestS3BatchEvent, mockLambdaContext)
    ).rejects.toThrowError('No tasks in event')
    expect(mockGetS3ObjectAsStream).not.toHaveBeenCalled()
    expect(mockDecryptS3Object).not.toHaveBeenCalled()
    expect(mockPutS3Object).not.toHaveBeenCalled()
  })
})
