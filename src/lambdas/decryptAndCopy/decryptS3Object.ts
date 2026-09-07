import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import { buildDecrypt } from '@aws-crypto/decrypt-node'
import { Readable } from 'stream'
import { logger } from '../../../common/sharedServices/logger'
import { getEnv } from '../../../common/utils/helpers'

// Maximum number of decryption passes. Some source objects are wrapped by the
// AWS Encryption SDK more than once (the plaintext of one decrypt is itself
// another AWS Encryption SDK message). We peel layers until the output is no
// longer an SDK message, capped to avoid an unbounded loop on unexpected data.
const MAX_DECRYPT_PASSES = 2

// AWS Encryption SDK message-format version byte. Every SDK-encrypted message
// begins with the version (0x01 for 1.0, 0x02 for 2.0). We use this as the
// signal that the current buffer is still encrypted and needs another pass.
// See the AWS Encryption SDK message format specification.
const AWS_ENCRYPTION_SDK_VERSION_BYTES = new Set([0x01, 0x02])

const streamToBuffer = (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })

const serializeError = (error: unknown) => ({
  message: error instanceof Error ? error.message : String(error),
  name: error instanceof Error ? error.name : undefined,
  stack: error instanceof Error ? error.stack : undefined
})

export const decryptS3Object = async (
  data: Readable | Buffer
): Promise<Buffer> => {
  const generatorKeyId = getEnv('GENERATOR_KEY_ID')
  const backupKeyId = getEnv('BACKUP_KEY_ID')

  let current = Buffer.isBuffer(data) ? data : await streamToBuffer(data)

  const { decrypt } = buildDecrypt()

  // The object handed to this function is always encrypted, so we always
  // perform at least one decryption pass. After each pass we inspect the
  // output: if it still looks like an AWS Encryption SDK message it was
  // multi-wrapped, so we decrypt again, up to MAX_DECRYPT_PASSES in total.
  let passes = 0
  do {
    current = await decryptOnce(decrypt, generatorKeyId, backupKeyId, current)
    passes += 1
  } while (
    looksLikeAwsEncryptionSdkMessage(current) &&
    passes < MAX_DECRYPT_PASSES
  )

  // If after the maximum number of passes the output still looks like an AWS
  // Encryption SDK message, the object is more deeply wrapped than we handle.
  // Fail loudly rather than write ciphertext to the analysis bucket, where it
  // would surface much later as an opaque Athena "Not in GZIP format" error.
  if (looksLikeAwsEncryptionSdkMessage(current)) {
    const error = new Error(
      `Data still appears to be AWS Encryption SDK encrypted after ${MAX_DECRYPT_PASSES} decryption passes`
    )
    logger.error(
      'Data still encrypted after maximum decryption passes',
      {
        errorCode: 'TICF015',
        passes,
        error: serializeError(error)
      }
    )
    throw error
  }

  return current
}

// Detects whether a buffer looks like an AWS Encryption SDK message by checking
// the leading version byte. Non-encrypted payloads (e.g. gzip, which starts
// 0x1f 0x8b) will not match, which is our signal to stop decrypting.
const looksLikeAwsEncryptionSdkMessage = (data: Buffer): boolean =>
  data.length > 0 && AWS_ENCRYPTION_SDK_VERSION_BYTES.has(data[0])

// Performs a single decryption pass, trying the primary (generator) key first
// and falling back to the backup key. Throws if both keys fail for this layer.
const decryptOnce = async (
  decrypt: ReturnType<typeof buildDecrypt>['decrypt'],
  generatorKeyId: string,
  backupKeyId: string,
  dataBuffer: Buffer
): Promise<Buffer> => {
  // Primary path: decrypt using Wrapper Key 1 (GENERATOR_KEY_ID)
  try {
    const primaryKeyring = new KmsKeyringNode({ keyIds: [generatorKeyId] })
    const { plaintext } = await decrypt(primaryKeyring, dataBuffer)
    return plaintext
  } catch (primaryError) {
    logger.warn(
      'Primary KMS wrapper key unavailable, attempting decryption with backup key',
      {
        errorCode: 'TICF011',
        error: serializeError(primaryError)
      }
    )
  }

  // Fallback path: decrypt using Wrapper Key 2 (BACKUP_KEY_ID)
  try {
    const backupKeyring = new KmsKeyringNode({ keyIds: [backupKeyId] })
    const { plaintext } = await decrypt(backupKeyring, dataBuffer)
    return plaintext
  } catch (backupError) {
    logger.error('Both KMS wrapper keys are unavailable, decryption failed', {
      errorCode: 'TICF012',
      error: serializeError(backupError)
    })
    throw backupError instanceof Error
      ? backupError
      : new Error(String(backupError))
  }
}
