// Under test
import { isValidSignature } from './validateRequestSource'
// Dependencies
import { ZendeskApiSecrets } from '../types/zendeskApiSecrets'
import { retrieveZendeskApiSecrets } from './retrieveZendeskApiSecrets'
import { exampleEventBody } from '../utils/tests/events/exampleEventBody'
import * as crypto from 'crypto'

jest.mock('./retrieveZendeskApiSecrets', () => ({
  retrieveZendeskApiSecrets: jest.fn()
}))
const mockRetrieveZendeskApiSecrets = retrieveZendeskApiSecrets as jest.Mock<
  Promise<ZendeskApiSecrets>
>
const givenSecretKeysSet = (secrets: ZendeskApiSecrets) => {
  mockRetrieveZendeskApiSecrets.mockResolvedValue(secrets)
}
const allSecretKeys: ZendeskApiSecrets = {
  zendeskApiKey: 'myZendeskApiKey',
  zendeskApiUserId: 'myZendeskApiUserId',
  zendeskApiUserEmail: 'my_zendesk@api-user.email.com',
  zendeskHostName: 'example-host.zendesk.com',
  zendeskWebhookSecretKey: 'testSecretKey123'
}
const givenAllSecretsAvailable = () => {
  givenSecretKeysSet(allSecretKeys)
}
const testTimeStamp = '2022-09-05T09:52:10Z'
const generateTestSignature = () => {
  return crypto
    .createHmac('sha256', allSecretKeys.zendeskWebhookSecretKey)
    .update(testTimeStamp + exampleEventBody)
    .digest('base64')
}

describe('isValidSignature', () => {
  it('returns true if signature is valid', async () => {
    givenAllSecretsAvailable()
    const testHeaderSignature = generateTestSignature()
    expect(
      await isValidSignature(
        testHeaderSignature,
        exampleEventBody,
        testTimeStamp
      )
    ).toBe(true)
  })
})
