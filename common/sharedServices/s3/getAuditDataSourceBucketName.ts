import { getFeatureFlagValue } from '../../utils/getFeatureFlagValue'
import { getEnv } from '../../../common/utils/helpers'

export const getAuditDataSourceBucketName = () =>
  getFeatureFlagValue('DECRYPT_DATA')
    ? getEnv('PERMANENT_AUDIT_BUCKET_NAME')
    : getEnv('AUDIT_BUCKET_NAME')
