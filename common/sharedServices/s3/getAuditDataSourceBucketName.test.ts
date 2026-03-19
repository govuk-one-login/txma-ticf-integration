import { vi } from 'vitest'
import { when } from 'vitest-when'
import { getFeatureFlagValue } from '../../utils/getFeatureFlagValue'
import {
  TEST_AUDIT_BUCKET,
  TEST_PERMANENT_BUCKET_NAME
} from '../../../common/utils/tests/testConstants'
import { getAuditDataSourceBucketName } from '../../../common/sharedServices/s3/getAuditDataSourceBucketName'

vi.mock('../../utils/getFeatureFlagValue', () => ({
  getFeatureFlagValue: vi.fn()
}))

describe('getAuditDataSourceBucketName', () => {
  const givenDecryptionFeatureFlagSetToValue = (value: boolean) =>
    when(getFeatureFlagValue).calledWith('DECRYPT_DATA').thenReturn(value)

  const givenDecryptionFeatureFlagOn = () => {
    givenDecryptionFeatureFlagSetToValue(true)
  }

  const givenDecryptionFeatureFlagOff = () => {
    givenDecryptionFeatureFlagSetToValue(false)
  }

  it('should return the original audit bucket when the decryption feature flag is off', () => {
    givenDecryptionFeatureFlagOff()
    expect(getAuditDataSourceBucketName()).toEqual(TEST_AUDIT_BUCKET)
  })

  it('should return the permanent encrypted audit bucket when the decryption feature flag is on', () => {
    givenDecryptionFeatureFlagOn()
    expect(getAuditDataSourceBucketName()).toEqual(TEST_PERMANENT_BUCKET_NAME)
  })
})
