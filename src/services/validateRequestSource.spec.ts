// Under test
import { isValidSignature } from './validateRequestSource'
// Dependencies
import * as crypto from 'crypto'
import { exampleEventBody } from '../utils/tests/events/exampleEventBody'
import { givenAllSecretsAvailable } from '../utils/tests/mocks/retrieveSecretKeys'
import { ALL_SECRET_KEYS } from '../utils/tests/testConstants'

jest.mock('./retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))
const testTimeStamp = '2022-09-05T09:52:10Z'
const generateTestSignature = () => {
  return crypto
    .createHmac('sha256', ALL_SECRET_KEYS.zendeskWebhookSecretKey)
    .update(testTimeStamp + exampleEventBody)
    .digest('base64')
}

describe('isValidSignature', () => {
  it('returns true if signature is valid', async () => {
    givenAllSecretsAvailable()
    const testHeaderSignature = generateTestSignature()
    const signatureValid = await isValidSignature(
      testHeaderSignature,
      exampleEventBody,
      testTimeStamp
    )
    expect(signatureValid).toBe(true)
  })

  it('returns false if signature is invalid', async () => {
    givenAllSecretsAvailable()
    const testHeaderSignature = 'testInvalidSignature'
    const signatureValid = await isValidSignature(
      testHeaderSignature,
      exampleEventBody,
      testTimeStamp
    )
    expect(signatureValid).toBe(false)
  })
})
