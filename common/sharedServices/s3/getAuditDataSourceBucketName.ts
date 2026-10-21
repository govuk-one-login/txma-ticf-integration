import { getEnv } from '../../../common/utils/helpers'
import { getFeatureFlagValue } from '../../utils/getFeatureFlagValue'

export const getAuditDataSourceBucketName = () =>
  getFeatureFlagValue('DECRYPT_DATA')
    ? getEnv('PERMANENT_AUDIT_BUCKET_NAME')
    : getEnv('AUDIT_BUCKET_NAME')
