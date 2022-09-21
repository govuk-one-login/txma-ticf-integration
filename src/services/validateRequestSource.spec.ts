// Under test
import { isSignatureInvalid } from './validateRequestSource'
// Dependencies
import * as crypto from 'crypto'
import { exampleEventBody } from '../utils/tests/events/exampleEventBody'
import { givenAllSecretsAvailable } from '../utils/tests/mocks/retrieveSecretKeys'
import { ALL_ZENDESK_SECRETS } from '../utils/tests/testConstants'
import { APIGatewayProxyEventHeaders } from 'aws-lambda'

jest.mock('../secrets/retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))
const generateTestHeaders = (): APIGatewayProxyEventHeaders => {
  const timestamp = '2022-09-05T09:52:10Z'
  const signature: string = crypto
    .createHmac('sha256', ALL_ZENDESK_SECRETS.zendeskWebhookSecretKey)
    .update(timestamp + exampleEventBody)
    .digest('base64')

  return {
    'X-Zendesk-Webhook-Signature-Timestamp': timestamp,
    'X-Zendesk-Webhook-Signature': signature
  }
}

describe('isSignatureInvalid', () => {
  let testHeaders: APIGatewayProxyEventHeaders
  beforeEach(() => {
    givenAllSecretsAvailable()
    testHeaders = generateTestHeaders()
  })

  it('returns false if header signature is valid', async () => {
    const signatureValidationResult = await isSignatureInvalid(
      testHeaders,
      exampleEventBody
    )

    expect(signatureValidationResult).toBe(false)
  })

  it('returns true if headers is undefined', async () => {
    const signatureValidationResult = await isSignatureInvalid(
      undefined,
      exampleEventBody
    )

    expect(signatureValidationResult).toBe(true)
  })

  it('returns true if header signature is invalid', async () => {
    testHeaders['X-Zendesk-Webhook-Signature'] = 'testInvalidSignature'

    const signatureValidationResult = await isSignatureInvalid(
      testHeaders,
      exampleEventBody
    )

    expect(signatureValidationResult).toBe(true)
  })

  it('returns true if header signature is undefined', async () => {
    testHeaders['X-Zendesk-Webhook-Signature'] = undefined

    const signatureValidationResult = await isSignatureInvalid(
      testHeaders,
      exampleEventBody
    )

    expect(signatureValidationResult).toBe(true)
  })

  it('returns true if header signature timestamp is undefined', async () => {
    testHeaders['X-Zendesk-Webhook-Signature-Timestamp'] = undefined

    const signatureValidationResult = await isSignatureInvalid(
      testHeaders,
      exampleEventBody
    )

    expect(signatureValidationResult).toBe(true)
  })

  it('returns true if body is null', async () => {
    const signatureValidationResult = await isSignatureInvalid(
      testHeaders,
      null
    )

    expect(signatureValidationResult).toBe(true)
  })
})
