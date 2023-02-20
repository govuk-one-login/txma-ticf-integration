import { getEnv, getFeatureFlagValue } from '../helpers'
import { s3ChangeStorageClass } from './s3ChangeStorageClass'
import { copyAuditDataFromTestDataBucket } from './s3CopyAuditDataFromTestDataBucket'
import { s3WaitForFile } from './s3WaitForFile'

export const setupAuditSourceTestData = async (
  testDataFileName: string,
  destinationPrefix: string,
  sendToGlacier = false
) => {
  const destinationS3Key = `${destinationPrefix}/${testDataFileName}`
  if (getFeatureFlagValue('DECRYPT_DATA')) {
    await setupEncryptedData(testDataFileName, destinationS3Key, sendToGlacier)
  } else {
    setupLegacyNonEncryptedData(
      testDataFileName,
      destinationS3Key,
      sendToGlacier
    )
  }
}

export const setupLegacyNonEncryptedData = async (
  testDataFileName: string,
  destinationS3Key: string,
  sendToGlacier = false
) => {
  await copyAuditDataFromTestDataBucket(
    getEnv('AUDIT_BUCKET_NAME'),
    destinationS3Key,
    testDataFileName,
    sendToGlacier ? 'GLACIER' : 'STANDARD',
    true
  )
}

export const setupEncryptedData = async (
  testDataFileName: string,
  destinationS3Key: string,
  sendToGlacier: boolean
) => {
  await copyAuditDataFromTestDataBucket(
    // TODO: read this from an env variable
    'audit-dev-temporary-message-batch',
    destinationS3Key,
    testDataFileName,
    'STANDARD',
    true
  )

  await s3WaitForFile('audit-dev-permanent-message-batch', destinationS3Key)
  if (sendToGlacier) {
    await s3ChangeStorageClass(
      'audit-dev-permanent-message-batch',
      destinationS3Key,
      'GLACIER'
    )
  }
}
