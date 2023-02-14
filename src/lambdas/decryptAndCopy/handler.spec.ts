import {
  TEST_ANALYSIS_BUCKET,
  TEST_PERMANENT_BUCKET_ARN,
  TEST_S3_OBJECT_DATA_BUFFER,
  TEST_S3_OBJECT_DATA_STRING,
  TEST_S3_OBJECT_KEY
} from '../../utils/tests/testConstants'
import { createDataStream } from '../../utils/tests/testHelpers'
import { getS3ObjectAsStream } from '../../sharedServices/s3/getS3ObjectAsStream'
import { decryptS3Object } from './decryptS3Object'
import { putS3Object } from '../../sharedServices/s3/putS3Object'
import { testS3BatchEvent } from '../../utils/tests/events/s3BatchEvent'
import { handler } from './handler'
import { mockLambdaContext } from '../../utils/tests/mocks/mockLambdaContext'

jest.mock('../../sharedServices/s3/getS3ObjectAsStream', () => ({
  getS3ObjectAsStream: jest.fn()
}))
jest.mock('./decryptS3Object', () => ({
  decryptS3Object: jest.fn()
}))
jest.mock('../../sharedServices/s3/putS3Object', () => ({
  putS3Object: jest.fn()
}))

const mockGetS3ObjectAsStream = getS3ObjectAsStream as jest.Mock
const mockDecryptS3Object = decryptS3Object as jest.Mock
const mockPutS3Object = putS3Object as jest.Mock

describe('DecryptAndCopy', function () {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('retrieves, decrypts and copies an S3 object', async () => {
    const s3ObjectStream = createDataStream(TEST_S3_OBJECT_DATA_STRING)
    mockGetS3ObjectAsStream.mockResolvedValue(s3ObjectStream)
    mockDecryptS3Object.mockResolvedValue(TEST_S3_OBJECT_DATA_BUFFER)

    await handler(testS3BatchEvent, mockLambdaContext)

    expect(mockGetS3ObjectAsStream).toHaveBeenCalledWith(
      TEST_PERMANENT_BUCKET_ARN,
      TEST_S3_OBJECT_KEY
    )
    expect(mockDecryptS3Object).toHaveBeenCalledWith(s3ObjectStream)
    expect(mockPutS3Object).toHaveBeenCalledWith(
      TEST_ANALYSIS_BUCKET,
      TEST_S3_OBJECT_KEY,
      TEST_S3_OBJECT_DATA_BUFFER
    )
  })

  // it('throws an error if there is no data in the SQS Event', async () => {
  //   expect(handler({ Records: [] })).rejects.toThrow('No data in event')
  //   expect(mockGetS3ObjectAsStream).not.toHaveBeenCalled()
  //   expect(mockPutS3Object).not.toHaveBeenCalled()
  // })

  //   it('throws an error if the SQS event comes from the wrong S3 bucket', async () => {
  //     expect(handler(wrongBucketTestS3SqsEvent)).rejects.toThrow(
  //       `Incorrect source bucket - ${TEST_WRONG_S3_BUCKET}`
  //     )
  //     expect(mockGetS3ObjectAsStream).not.toHaveBeenCalled()
  //     expect(mockPutS3Object).not.toHaveBeenCalled()
  //   })
})
