import { getValidRecipientBucketName } from './getValidRecipientBucketName'

describe('getValidRecipientBucketName', () => {
  it('should return the correct name for the valid email recipient bucket', () => {
    const testEnvironment = 'myEnvironment'
    expect(getValidRecipientBucketName(testEnvironment)).toEqual(
      `txma-data-analysis-${testEnvironment}-email-recipients`
    )
  })
})
