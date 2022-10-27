import {
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import {
  TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
  TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY
} from '../../utils/tests/testConstants'
import { readS3DataToString } from './readS3DataToString'
import 'aws-sdk-client-mock-jest'

const s3Mock = mockClient(S3Client)
const getObjectCommandInput: GetObjectCommandInput = {
  Bucket: TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
  Key: TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY
}
const testRecipientEmailList =
  'recipient1@somedomain.gov.uk\nrecipient2@somedomain.gov.uk'
const givenRecipientEmailListAvailable = () => {
  s3Mock
    .on(GetObjectCommand)
    .resolves({ Body: Buffer.from(testRecipientEmailList, 'ascii') })
}
const givenRecipientEmailListUnavailable = () => {
  s3Mock.on(GetObjectCommand).resolves({})
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

  it('throws an error if no recipient list was found', async () => {
    givenRecipientEmailListUnavailable()

    await expect(
      readS3DataToString(
        TEST_VALID_EMAIL_RECIPIENTS_BUCKET,
        TEST_VALID_EMAIL_RECIPIENTS_BUCKET_KEY
      )
    ).rejects.toThrow('Valid recipient list not found')
    expect(s3Mock).toHaveReceivedCommandWith(
      GetObjectCommand,
      getObjectCommandInput
    )
  })
})
