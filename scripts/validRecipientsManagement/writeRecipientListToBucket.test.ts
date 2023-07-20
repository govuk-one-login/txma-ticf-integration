import { getValidRecipientBucketName } from './getValidRecipientBucketName'
import { when } from 'jest-when'
import { writeRecipientListToBucket } from './writeRecipientListToBucket'
import { putS3Object } from '../../src/sharedServices/s3/putS3Object'

jest.mock('./getValidRecipientBucketName', () => ({
  getValidRecipientBucketName: jest.fn()
}))

jest.mock('../../src/sharedServices/s3/putS3Object', () => ({
  putS3Object: jest.fn()
}))

describe('writeRecipientListToBucket', () => {
  it('should write the data to the correct bucket and file name', async () => {
    const testEnvironment = 'myEnvironment'
    const testBucketName = 'emailRecipientsBucketName'
    const recipient1 = 'email1@test.gov.uk'
    const recipient2 = 'email2@test.gov.uk'
    const recipient3 = 'email3@test.gov.uk'

    when(getValidRecipientBucketName).mockReturnValue(testBucketName)

    await writeRecipientListToBucket(
      [recipient1, recipient2, recipient3],
      testEnvironment
    )

    expect(getValidRecipientBucketName).toHaveBeenCalledWith(testEnvironment)
    expect(putS3Object).toHaveBeenCalledWith(
      testBucketName,
      'valid-email-recipients.txt',
      Buffer.from(`${recipient1}\n${recipient2}\n${recipient3}`)
    )
  })
})
