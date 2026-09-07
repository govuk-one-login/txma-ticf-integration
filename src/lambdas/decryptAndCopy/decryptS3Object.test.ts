import { vi } from 'vitest'
import { buildDecrypt, MessageHeader } from '@aws-crypto/decrypt-node'
import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import {
  TEST_BACKUP_KEY_ID,
  TEST_GENERATOR_KEY_ID,
  TEST_S3_OBJECT_DATA_BUFFER,
  TEST_S3_OBJECT_DATA_STRING
} from '../../../common/utils/tests/testConstants'
import { createDataStream } from '../../../common/utils/tests/testHelpers'
import { decryptS3Object } from './decryptS3Object'
import { logger } from '../../../common/sharedServices/logger'
import { Readable } from 'stream'

const mockDecrypt = vi.fn()

vi.mock('@aws-crypto/decrypt-node', () => ({
  buildDecrypt: vi.fn()
}))
vi.mock('@aws-crypto/kms-keyring-node', () => ({
  KmsKeyringNode: vi.fn()
}))
vi.mock('../../../common/sharedServices/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('decryptS3Object', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GENERATOR_KEY_ID = TEST_GENERATOR_KEY_ID
    process.env.BACKUP_KEY_ID = TEST_BACKUP_KEY_ID
    vi.mocked(buildDecrypt).mockReturnValue({ decrypt: mockDecrypt } as never)
    vi.mocked(KmsKeyringNode).mockImplementation(function (
      this: unknown,
      config: never
    ) {
      return config
    } as never)
  })

  describe('primary key decryption', () => {
    it('decrypts successfully using the primary key (GENERATOR_KEY_ID)', async () => {
      // Unit Test
      mockDecrypt.mockResolvedValueOnce({
        plaintext: TEST_S3_OBJECT_DATA_BUFFER,
        messageHeader: {} as MessageHeader
      })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
      expect(KmsKeyringNode).toHaveBeenCalledWith({
        keyIds: [TEST_GENERATOR_KEY_ID]
      })
      expect(mockDecrypt).toHaveBeenCalledTimes(1)
      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('accepts a Buffer input and decrypts with primary key', async () => {
      // Unit Test
      mockDecrypt.mockResolvedValueOnce({
        plaintext: TEST_S3_OBJECT_DATA_BUFFER,
        messageHeader: {} as MessageHeader
      })

      const result = await decryptS3Object(TEST_S3_OBJECT_DATA_BUFFER)

      expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
      expect(KmsKeyringNode).toHaveBeenCalledWith({
        keyIds: [TEST_GENERATOR_KEY_ID]
      })
      expect(mockDecrypt).toHaveBeenCalledTimes(1)
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('throws when the input stream errors before decryption', async () => {
      // Unit Test
      const streamError = new Error('Stream read failure')
      const errorStream = new Readable({ read() {} }) // eslint-disable-line @typescript-eslint/no-empty-function
      process.nextTick(() => errorStream.destroy(streamError))

      await expect(decryptS3Object(errorStream)).rejects.toThrow(
        'Stream read failure'
      )
      expect(mockDecrypt).not.toHaveBeenCalled()
    })
  })

  describe('fallback to backup key', () => {
    it('decrypts successfully using the backup key (BACKUP_KEY_ID) when primary is unavailable', async () => {
      // Unit Test
      mockDecrypt
        .mockRejectedValueOnce(new Error('KMS key unavailable'))
        .mockResolvedValueOnce({
          plaintext: TEST_S3_OBJECT_DATA_BUFFER,
          messageHeader: {} as MessageHeader
        })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
      expect(KmsKeyringNode).toHaveBeenNthCalledWith(1, {
        keyIds: [TEST_GENERATOR_KEY_ID]
      })
      expect(KmsKeyringNode).toHaveBeenNthCalledWith(2, {
        keyIds: [TEST_BACKUP_KEY_ID]
      })
      expect(mockDecrypt).toHaveBeenCalledTimes(2)
      expect(logger.warn).toHaveBeenCalledWith(
        'Primary KMS wrapper key unavailable, attempting decryption with backup key',
        expect.objectContaining({
          errorCode: 'TICF011',
          error: expect.objectContaining({ message: 'KMS key unavailable' })
        })
      )
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('uses backup key when primary key is missing from KMS and retrieves data', async () => {
      // Unit Test
      const accessDeniedError = new Error(
        'AccessDeniedException: User is not authorized'
      )
      mockDecrypt
        .mockRejectedValueOnce(accessDeniedError)
        .mockResolvedValueOnce({
          plaintext: TEST_S3_OBJECT_DATA_BUFFER,
          messageHeader: {} as MessageHeader
        })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
      expect(KmsKeyringNode).toHaveBeenNthCalledWith(2, {
        keyIds: [TEST_BACKUP_KEY_ID]
      })
      expect(logger.warn).toHaveBeenCalledWith(
        'Primary KMS wrapper key unavailable, attempting decryption with backup key',
        expect.objectContaining({
          errorCode: 'TICF011',
          error: expect.objectContaining({ message: accessDeniedError.message })
        })
      )
    })

    it('wraps a non-Error primary failure and falls back to backup key', async () => {
      // Unit Test
      mockDecrypt
        .mockRejectedValueOnce('string-rejection')
        .mockResolvedValueOnce({
          plaintext: TEST_S3_OBJECT_DATA_BUFFER,
          messageHeader: {} as MessageHeader
        })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
      expect(logger.warn).toHaveBeenCalledWith(
        'Primary KMS wrapper key unavailable, attempting decryption with backup key',
        expect.objectContaining({
          errorCode: 'TICF011',
          error: expect.objectContaining({ message: 'string-rejection' })
        })
      )
    })
  })

  describe('multi-pass decryption of layered (double-encrypted) objects', () => {
    // An intermediate layer: still an AWS Encryption SDK message, so it begins
    // with the SDK version byte (0x02). This should trigger another pass.
    const ENCRYPTED_LAYER = Buffer.from([0x02, 0x05, 0x78, 0x61, 0x00, 0x01])
    // The final plaintext payload: gzip, which starts 0x1f 0x8b and is NOT an
    // SDK message, so decryption should stop.
    const GZIP_PLAINTEXT = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00])

    it('decrypts twice when the first pass yields another SDK message, returning the final payload', async () => {
      // Unit Test
      mockDecrypt
        .mockResolvedValueOnce({
          plaintext: ENCRYPTED_LAYER,
          messageHeader: {} as MessageHeader
        })
        .mockResolvedValueOnce({
          plaintext: GZIP_PLAINTEXT,
          messageHeader: {} as MessageHeader
        })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(GZIP_PLAINTEXT)
      expect(mockDecrypt).toHaveBeenCalledTimes(2)
      // Each pass starts by trying the generator key.
      expect(KmsKeyringNode).toHaveBeenNthCalledWith(1, {
        keyIds: [TEST_GENERATOR_KEY_ID]
      })
      expect(KmsKeyringNode).toHaveBeenNthCalledWith(2, {
        keyIds: [TEST_GENERATOR_KEY_ID]
      })
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('stops after one pass when the first pass already yields a non-SDK payload', async () => {
      // Unit Test
      mockDecrypt.mockResolvedValueOnce({
        plaintext: GZIP_PLAINTEXT,
        messageHeader: {} as MessageHeader
      })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(GZIP_PLAINTEXT)
      expect(mockDecrypt).toHaveBeenCalledTimes(1)
    })

    it('caps at 3 passes and throws TICF015 when data is still encrypted afterwards', async () => {
      // Unit Test: every pass yields another SDK-looking layer.
      mockDecrypt.mockResolvedValue({
        plaintext: ENCRYPTED_LAYER,
        messageHeader: {} as MessageHeader
      })

      await expect(
        decryptS3Object(createDataStream(TEST_S3_OBJECT_DATA_STRING))
      ).rejects.toThrow(
        'Data still appears to be AWS Encryption SDK encrypted after 2 decryption passes'
      )

      expect(mockDecrypt).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenCalledWith(
        'Data still encrypted after maximum decryption passes',
        expect.objectContaining({
          errorCode: 'TICF015',
          passes: 2
        })
      )
    })

    it('falls back to the backup key on a later pass if the generator key fails', async () => {
      // Unit Test: pass 1 succeeds with generator and yields another layer;
      // pass 2 fails on generator, then succeeds on backup with final payload.
      mockDecrypt
        .mockResolvedValueOnce({
          plaintext: ENCRYPTED_LAYER,
          messageHeader: {} as MessageHeader
        })
        .mockRejectedValueOnce(new Error('KMS key unavailable'))
        .mockResolvedValueOnce({
          plaintext: GZIP_PLAINTEXT,
          messageHeader: {} as MessageHeader
        })

      const result = await decryptS3Object(
        createDataStream(TEST_S3_OBJECT_DATA_STRING)
      )

      expect(result).toEqual(GZIP_PLAINTEXT)
      expect(mockDecrypt).toHaveBeenCalledTimes(3)
      expect(KmsKeyringNode).toHaveBeenNthCalledWith(3, {
        keyIds: [TEST_BACKUP_KEY_ID]
      })
      expect(logger.warn).toHaveBeenCalledWith(
        'Primary KMS wrapper key unavailable, attempting decryption with backup key',
        expect.objectContaining({ errorCode: 'TICF011' })
      )
    })
  })

  describe('both keys unavailable', () => {
    it('throws and logs an error when both KMS keys are unavailable', async () => {
      // Unit Test
      const backupError = new Error('All KMS keys inaccessible')
      mockDecrypt
        .mockRejectedValueOnce(new Error('Primary key unavailable'))
        .mockRejectedValueOnce(backupError)

      await expect(
        decryptS3Object(createDataStream(TEST_S3_OBJECT_DATA_STRING))
      ).rejects.toThrow('All KMS keys inaccessible')

      expect(logger.warn).toHaveBeenCalledWith(
        'Primary KMS wrapper key unavailable, attempting decryption with backup key',
        expect.any(Object)
      )
      expect(logger.error).toHaveBeenCalledWith(
        'Both KMS wrapper keys are unavailable, decryption failed',
        expect.objectContaining({
          errorCode: 'TICF012',
          error: expect.objectContaining({
            message: 'All KMS keys inaccessible'
          })
        })
      )
    })

    it('wraps a non-Error backup failure and rethrows', async () => {
      // Unit Test
      mockDecrypt
        .mockRejectedValueOnce(new Error('Primary key unavailable'))
        .mockRejectedValueOnce('backup-string-rejection')

      await expect(
        decryptS3Object(createDataStream(TEST_S3_OBJECT_DATA_STRING))
      ).rejects.toThrow('backup-string-rejection')

      expect(logger.error).toHaveBeenCalledWith(
        'Both KMS wrapper keys are unavailable, decryption failed',
        expect.objectContaining({
          errorCode: 'TICF012',
          error: expect.objectContaining({ message: 'backup-string-rejection' })
        })
      )
    })
  })
})
