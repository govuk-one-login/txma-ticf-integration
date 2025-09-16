import {
  S3Client,
  GetObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandOutput
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import {
  TEST_PERMANENT_BUCKET_NAME,
  TEST_S3_OBJECT_DATA_STRING,
  TEST_S3_OBJECT_KEY
} from '../../../common/utils/tests/testConstants'
import { createDataStream } from '../../utils/tests/testHelpers'
import { getS3ObjectAsStream } from '../../../common/sharedServices/s3/getS3ObjectAsStream'

process.env.AWS_REGION = 'eu-west-2'
const s3Mock = mockClient(S3Client)
const getObjectCommandInput: GetObjectCommandInput = {
  Bucket: TEST_PERMANENT_BUCKET_NAME,
  Key: TEST_S3_OBJECT_KEY
}

const givenDataAvailable = () => {
  s3Mock.on(GetObjectCommand).resolves({
    Body: createDataStream(TEST_S3_OBJECT_DATA_STRING)
  } as GetObjectCommandOutput)
}

describe('getS3Object - ', () => {
  beforeEach(() => {
    s3Mock.reset()
  })

  it('getS3ObjectAsStream returns a stream read from the file', async () => {
    givenDataAvailable()
    const testDataStream = createDataStream(TEST_S3_OBJECT_DATA_STRING)

    const returnedData = await getS3ObjectAsStream(
      TEST_PERMANENT_BUCKET_NAME,
      TEST_S3_OBJECT_KEY
    )

    expect(s3Mock).toHaveReceivedCommandWith(
      GetObjectCommand,
      getObjectCommandInput
    )
    expect(returnedData).toEqual(testDataStream)
  })

  it('throws error when Body is not a Readable stream', async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: 'not a stream' as unknown
    } as GetObjectCommandOutput)

    await expect(
      getS3ObjectAsStream(TEST_PERMANENT_BUCKET_NAME, TEST_S3_OBJECT_KEY)
    ).rejects.toThrow('Get S3 Object command did not return stream')
  })
})
