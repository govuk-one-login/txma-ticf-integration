#!/usr/bin/env node

import { buildDecrypt } from '@aws-crypto/decrypt-node'
import { KmsKeyringNode } from '@aws-crypto/kms-keyring-node'
import { createGunzip } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

// Set AWS profile
process.env.AWS_PROFILE = 'audit-build'
process.env.AWS_REGION = 'eu-west-2'

async function decryptAndDecompress(inputFile, outputFile, kmsKeyId) {
  try {
    console.log('Starting decryption and decompression...')

    // Set up KMS keyring
    const keyring = new KmsKeyringNode({
      generatorKeyId: kmsKeyId
    })

    const { decrypt } = buildDecrypt()

    // Read encrypted file
    const encryptedData = createReadStream(inputFile)

    // Decrypt the data
    console.log('Decrypting...')
    const { plaintext } = await decrypt(keyring, encryptedData)

    // Decompress the decrypted data
    console.log('Decompressing...')
    const gunzip = createGunzip()
    const output = createWriteStream(outputFile)

    await pipeline(Readable.from(plaintext), gunzip, output)

    console.log(`Successfully decrypted and decompressed to: ${outputFile}`)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Usage: node decrypt-and-decompress.mjs <input-file> <output-file> <kms-key-id>
const [, , inputFile, outputFile, kmsKeyId] = process.argv

if (!inputFile || !outputFile || !kmsKeyId) {
  console.log(
    'Usage: node decrypt-and-decompress.mjs <input-file> <output-file> <kms-key-id>'
  )
  console.log(
    'Example: node decrypt-and-decompress.mjs glacier-ir-test.gz decrypted-content.txt arn:aws:kms:eu-west-2:123456789:key/your-key-id'
  )
  process.exit(1)
}

decryptAndDecompress(inputFile, outputFile, kmsKeyId)
