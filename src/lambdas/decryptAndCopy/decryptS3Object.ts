import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import { buildDecrypt } from '@aws-crypto/decrypt-node'
import { Readable } from 'stream'
import { getEnv } from '../../utils/helpers'

export const decryptS3Object = async (data: Readable): Promise<Buffer> => {
  const keyring = new KmsKeyringNode({
    generatorKeyId: getEnv('GENERATOR_KEY_ID')
  })
  // 'context' object may be required if added to corresponding encryption function

  const { decrypt } = buildDecrypt()

  const { plaintext } = await decrypt(keyring, data)

  return plaintext
}
