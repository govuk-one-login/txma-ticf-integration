import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import {
  TEST_ANALYSIS_BUCKET,
  TEST_S3_OBJECT_KEY,
  TEST_S3_OBJECT_DATA_BUFFER
} from '../../../common/utils/tests/testConstants'

import { putS3Object } from '../../../common/sharedServices/s3/putS3Object'

const s3Mock = mockClient(S3Client)

describe('putS3Object', () => {
  const putObjectCommandInput: PutObjectCommandInput = {
    Bucket: TEST_ANALYSIS_BUCKET,
    Key: TEST_S3_OBJECT_KEY,
    Body: TEST_S3_OBJECT_DATA_BUFFER
  }

  it('uploads an object', async () => {
    await putS3Object(
      TEST_ANALYSIS_BUCKET,
      TEST_S3_OBJECT_KEY,
      TEST_S3_OBJECT_DATA_BUFFER
    )

    expect(s3Mock).toHaveReceivedCommandWith(
      PutObjectCommand,
      putObjectCommandInput
    )
  })
})
