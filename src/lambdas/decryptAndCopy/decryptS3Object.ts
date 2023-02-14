import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import { buildDecrypt } from '@aws-crypto/decrypt-node'
import { Readable } from 'stream'
import { getEnv } from '../../utils/helpers'

export const decryptS3Object = async (data: Readable): Promise<Buffer> => {
  const keyring = new KmsKeyringNode({
    generatorKeyId: getEnv('GENERATOR_KEY_ID')
  })
  // considering including context in encryption - considered good practice to do so
  // if included, the same context object will be required for decryption
  // const context = {
  //     some: 'key',
  // };
  const { decrypt } = buildDecrypt()

  const { plaintext } = await decrypt(keyring, data)

  return plaintext
}
