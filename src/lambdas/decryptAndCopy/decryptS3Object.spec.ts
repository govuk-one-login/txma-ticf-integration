import { buildDecrypt, MessageHeader } from '@aws-crypto/decrypt-node'
import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import { when } from 'jest-when'
import {
  TEST_GENERATOR_KEY_ID,
  TEST_S3_OBJECT_DATA_BUFFER,
  TEST_S3_OBJECT_DATA_STRING
} from '../../utils/tests/testConstants'
import { createDataStream } from '../../utils/tests/testHelpers'
import { decryptS3Object } from './decryptS3Object'

jest.mock('@aws-crypto/decrypt-node', () => ({
  buildDecrypt: jest.fn().mockReturnValue({
    decrypt: jest.fn()
  })
}))
jest.mock('@aws-crypto/kms-keyring-node', () => ({
  KmsKeyringNode: jest.fn()
}))

describe('decryptS3Object', () => {
  process.env.GENERATOR_KEY_ID = TEST_GENERATOR_KEY_ID

  it('returns a buffer of decrypted data', async () => {
    when(KmsKeyringNode as jest.Mock).mockImplementation(() => ({
      generatorKeyId: TEST_GENERATOR_KEY_ID
    }))
    when(buildDecrypt().decrypt).mockResolvedValue({
      plaintext: TEST_S3_OBJECT_DATA_BUFFER,
      messageHeader: {} as MessageHeader
    })
    const testDataStream = createDataStream(TEST_S3_OBJECT_DATA_STRING)
    const result = await decryptS3Object(testDataStream)
    expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
    expect(KmsKeyringNode).toHaveBeenCalledWith({
      generatorKeyId: TEST_GENERATOR_KEY_ID
    })
    expect(buildDecrypt).toHaveBeenCalled()
    expect(buildDecrypt().decrypt).toHaveBeenCalledWith(
      { generatorKeyId: TEST_GENERATOR_KEY_ID },
      testDataStream
    )
  })
})
