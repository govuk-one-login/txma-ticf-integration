import {
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import {
  TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
  TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY
} from '../../../common/utils/tests/testConstants'
import { readS3DataToString } from '../../../common/sharedServices/s3/readS3DataToString'
import 'aws-sdk-client-mock-jest'
import { StreamingBlobPayloadOutputTypes } from '@smithy/types'
import { Readable } from 'stream'

const s3Mock = mockClient(S3Client)
const getObjectCommandInput: GetObjectCommandInput = {
  Bucket: TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
  Key: TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY
}
const testRecipientEmailList = 'recipient1@example.com\nrecipient2@example.com'

const createDataStream = () => {
  const dataStream = new Readable()
  dataStream.push(testRecipientEmailList)
  dataStream.push(null)
  return dataStream
}
const givenRecipientEmailListAvailable = () => {
  s3Mock
    .on(GetObjectCommand)
    .resolves({ Body: createDataStream() as StreamingBlobPayloadOutputTypes })
}

describe('readS3DataToString', () => {
  it('returns a string read from the file', async () => {
    givenRecipientEmailListAvailable()

    const returnedRecipientList = await readS3DataToString(
      TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
      TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY
    )

    expect(s3Mock).toHaveReceivedCommandWith(
      GetObjectCommand,
      getObjectCommandInput
    )
    expect(returnedRecipientList).toEqual(testRecipientEmailList)
  })
})
