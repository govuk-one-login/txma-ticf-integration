import {
  CopyObjectCommand,
  CopyObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import { copyS3Object } from './copyS3Object'
import 'aws-sdk-client-mock-jest'

const s3Mock = mockClient(S3Client)
const TEST_S3_BUCKET_DESTINATION = '/aTestBucket/data/folder'
const TEST_FILE_NAME = '46e34211-f930-4e15-a9fb-802f2ae77052.csv'
const TEST_FILE_PATH = '/sourcebucket/data/'

describe('copyS3Object tests', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const copyCommandInput: CopyObjectCommandInput = {
    Bucket: TEST_S3_BUCKET_DESTINATION,
    Key: TEST_FILE_NAME,
    CopySource: `${TEST_FILE_PATH}/${TEST_FILE_NAME}`
  }

  it('copies an s3 Object', async () => {
    await copyS3Object(
      TEST_FILE_NAME,
      TEST_FILE_PATH,
      TEST_S3_BUCKET_DESTINATION
    )

    expect(s3Mock).toHaveReceivedCommandWith(
      CopyObjectCommand,
      copyCommandInput
    )
  })
})
