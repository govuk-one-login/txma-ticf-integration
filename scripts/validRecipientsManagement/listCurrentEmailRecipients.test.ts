import { listCurrentEmailRecipients } from './listCurrentEmailRecipients'
import { readS3DataToString } from '../../src/sharedServices/s3/readS3DataToString'
import { getValidRecipientBucketName } from './getValidRecipientBucketName'
import { when } from 'jest-when'
jest.mock('../../src/sharedServices/s3/readS3DataToString', () => ({
  readS3DataToString: jest.fn()
}))

jest.mock('./getValidRecipientBucketName', () => ({
  getValidRecipientBucketName: jest.fn()
}))

describe('listCurrentEmailRecipients', () => {
  it('should read from the correct bucket and file name, and return the data as a list', async () => {
    const testEnvironment = 'myEnvironment'
    const testBucketName = 'emailRecipientsBucketName'
    const recipient1 = 'email1@example.com'
    const recipient2 = 'email2@example.com'
    const recipient3 = 'email3@example.com'

    when(getValidRecipientBucketName).mockReturnValue(testBucketName)
    when(readS3DataToString).mockResolvedValue(
      `${recipient1}\n${recipient2}\n${recipient3}`
    )

    const results = await listCurrentEmailRecipients(testEnvironment)
    expect(getValidRecipientBucketName).toHaveBeenCalledWith(testEnvironment)
    expect(readS3DataToString).toHaveBeenCalledWith(
      testBucketName,
      'valid-email-recipients.txt'
    )
    expect(results).toEqual([recipient1, recipient2, recipient3])
  })
})
