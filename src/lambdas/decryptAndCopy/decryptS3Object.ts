import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import { buildDecrypt } from '@aws-crypto/decrypt-node'
import { Readable } from 'stream'
import { logger } from '../../../common/sharedServices/logger'
import { getEnv } from '../../../common/utils/helpers'

const streamToBuffer = (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })

export const decryptS3Object = async (
  data: Readable | Buffer
): Promise<Buffer> => {
  const generatorKeyId = getEnv('GENERATOR_KEY_ID')
  const backupKeyId = getEnv('BACKUP_KEY_ID')

  const dataBuffer = Buffer.isBuffer(data) ? data : await streamToBuffer(data)

  const { decrypt } = buildDecrypt()

  // Primary path: decrypt using Wrapper Key 1 (GENERATOR_KEY_ID)
  try {
    const primaryKeyring = new KmsKeyringNode({ keyIds: [generatorKeyId] })
    const { plaintext } = await decrypt(primaryKeyring, dataBuffer)
    return plaintext
  } catch (primaryError) {
    const primaryErr =
      primaryError instanceof Error
        ? primaryError
        : new Error(String(primaryError))
    logger.warn(
      'Primary KMS wrapper key unavailable – system operating in degraded mode, attempting decryption with backup key',
      primaryErr
    )
  }

  // Fallback path: decrypt using Wrapper Key 2 (BACKUP_KEY_ID)
  try {
    const backupKeyring = new KmsKeyringNode({ keyIds: [backupKeyId] })
    const { plaintext } = await decrypt(backupKeyring, dataBuffer)
    return plaintext
  } catch (backupError) {
    const backupErr =
      backupError instanceof Error
        ? backupError
        : new Error(String(backupError))
    logger.error(
      'Both KMS wrapper keys are unavailable – decryption failed',
      backupErr
    )
    throw backupErr
  }
}
