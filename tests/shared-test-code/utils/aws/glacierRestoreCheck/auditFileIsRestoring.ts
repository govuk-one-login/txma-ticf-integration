import { getEnv, getFeatureFlagValue } from '../../helpers'
import { s3HeadObject } from './s3HeadObject'

export const auditFileIsRestoring = async (s3Key: string): Promise<boolean> => {
  const bucket = getFeatureFlagValue('DECRYPT_DATA')
    ? getEnv('PERMANENT_AUDIT_BUCKET_NAME')
    : getEnv('AUDIT_BUCKET_NAME')
  console.log(`Looking for s3 object ${s3Key} in bucket ${bucket}`)
  const headObjectResponse = await s3HeadObject(bucket, s3Key)
  console.log(
    `headObjectResponse for ${s3Key} is ${JSON.stringify(headObjectResponse)}`
  )
  return headObjectResponse.Restore === 'ongoing-request="true"'
}
