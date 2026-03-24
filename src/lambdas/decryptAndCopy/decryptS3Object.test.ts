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

const mockDecrypt = jest.fn()

jest.mock('@aws-crypto/decrypt-node', () => ({
  buildDecrypt: jest.fn()
}))
jest.mock('@aws-crypto/kms-keyring-node', () => ({
  KmsKeyringNode: jest.fn()
}))
jest.mock('../../../common/sharedServices/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe('decryptS3Object', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GENERATOR_KEY_ID = TEST_GENERATOR_KEY_ID
    process.env.BACKUP_KEY_ID = TEST_BACKUP_KEY_ID
    ;(buildDecrypt as jest.Mock).mockReturnValue({ decrypt: mockDecrypt })
    ;(KmsKeyringNode as jest.Mock).mockImplementation((config) => config)
  })

  describe('primary key decryption', () => {
    it('decrypts successfully using the primary key (GENERATOR_KEY_ID)', async () => {
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

    // it('accepts a Buffer input and decrypts with primary key', async () => {
    //   mockDecrypt.mockResolvedValueOnce({
    //     plaintext: TEST_S3_OBJECT_DATA_BUFFER,
    //     messageHeader: {} as MessageHeader
    //   })
    //
    //   const result = await decryptS3Object(TEST_S3_OBJECT_DATA_BUFFER)
    //
    //   expect(result).toEqual(TEST_S3_OBJECT_DATA_BUFFER)
    //   expect(KmsKeyringNode).toHaveBeenCalledWith({
    //     keyIds: [TEST_GENERATOR_KEY_ID]
    //   })
    //   expect(mockDecrypt).toHaveBeenCalledTimes(1)
    //   expect(logger.warn).not.toHaveBeenCalled()
    // })

    it('throws when the input stream errors before decryption', async () => {
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
        expect.stringContaining('Primary KMS wrapper key unavailable'),
        expect.objectContaining({ message: 'KMS key unavailable' })
      )
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('uses backup key when primary key is missing from KMS and retrieves data', async () => {
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
        expect.stringContaining('degraded mode'),
        expect.objectContaining({ message: accessDeniedError.message })
      )
    })

    it('wraps a non-Error primary failure and falls back to backup key', async () => {
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
        expect.stringContaining('Primary KMS wrapper key unavailable'),
        expect.objectContaining({ message: 'string-rejection' })
      )
    })
  })

  describe('both keys unavailable', () => {
    it('throws and logs an error when both KMS keys are unavailable', async () => {
      const backupError = new Error('All KMS keys inaccessible')
      mockDecrypt
        .mockRejectedValueOnce(new Error('Primary key unavailable'))
        .mockRejectedValueOnce(backupError)

      await expect(
        decryptS3Object(createDataStream(TEST_S3_OBJECT_DATA_STRING))
      ).rejects.toThrow('All KMS keys inaccessible')

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Primary KMS wrapper key unavailable'),
        expect.any(Object)
      )
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Both KMS wrapper keys'),
        expect.objectContaining({ message: 'All KMS keys inaccessible' })
      )
    })

    it('wraps a non-Error backup failure and rethrows', async () => {
      mockDecrypt
        .mockRejectedValueOnce(new Error('Primary key unavailable'))
        .mockRejectedValueOnce('backup-string-rejection')

      await expect(
        decryptS3Object(createDataStream(TEST_S3_OBJECT_DATA_STRING))
      ).rejects.toThrow('backup-string-rejection')

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Both KMS wrapper keys'),
        expect.objectContaining({ message: 'backup-string-rejection' })
      )
    })
  })
})
