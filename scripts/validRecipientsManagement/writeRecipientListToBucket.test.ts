import { vi } from 'vitest'
import { getValidRecipientBucketName } from './getValidRecipientBucketName'
import { writeRecipientListToBucket } from './writeRecipientListToBucket'
import { putS3Object } from '../../common/sharedServices/s3/putS3Object'

vi.mock('./getValidRecipientBucketName', () => ({
  getValidRecipientBucketName: vi.fn()
}))

vi.mock('../../common/sharedServices/s3/putS3Object', () => ({
  putS3Object: vi.fn()
}))

describe('writeRecipientListToBucket', () => {
  it('should write the data to the correct bucket and file name', async () => {
    const testEnvironment = 'myEnvironment'
    const testBucketName = 'emailRecipientsBucketName'
    const recipient1 = 'email1@example.com'
    const recipient2 = 'email2@example.com'
    const recipient3 = 'email3@example.com'

    vi.mocked(getValidRecipientBucketName).mockReturnValue(testBucketName)

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
