// Under test
import { retrieveZendeskApiSecrets } from './retrieveZendeskApiSecrets'
// Dependencies
import { retrieveSecrets } from './retrieveSecrets'
jest.mock('./retrieveSecrets', () => ({
  retrieveSecrets: jest.fn()
}))

const mockRetrieveSecrets = retrieveSecrets as jest.Mock<
  Promise<{ [key: string]: string }>
>

const TEST_ZENDESK_API_KEY = 'myZendeskApiKey'
const TEST_ZENDESK_API_USER_ID = 'myZendeskApiUserId'
const TEST_ZENDESK_API_USER_EMAIL = 'myZendeskApiUserEmail'
const TEST_ZENDESK_HOSTNAME = 'example-host.zendesk.com'
const TEST_ZENDESK_WEBHOOK_SECRET_KEY = 'testSecretKey123'

describe('retrieveZendeskApiSecrets', () => {
  const givenSecretKeysSet = (secrets: { [key: string]: string }) => {
    mockRetrieveSecrets.mockResolvedValue(secrets)
  }
  const allSecretKeys = {
    ZENDESK_API_KEY: TEST_ZENDESK_API_KEY,
    ZENDESK_API_USER_ID: TEST_ZENDESK_API_USER_ID,
    ZENDESK_API_USER_EMAIL: TEST_ZENDESK_API_USER_EMAIL,
    ZENDESK_HOSTNAME: TEST_ZENDESK_HOSTNAME,
    ZENDESK_WEBHOOK_SECRET_KEY: TEST_ZENDESK_WEBHOOK_SECRET_KEY
  }

  const givenAllSecretsAvailable = () => {
    givenSecretKeysSet(allSecretKeys)
  }

  it('should return object containing secrets when available', async () => {
    givenAllSecretsAvailable()
    const secrets = await retrieveZendeskApiSecrets()
    expect(secrets.zendeskApiKey).toEqual(TEST_ZENDESK_API_KEY)
    expect(secrets.zendeskApiUserEmail).toEqual(TEST_ZENDESK_API_USER_EMAIL)
    expect(secrets.zendeskApiUserId).toEqual(TEST_ZENDESK_API_USER_ID)
    expect(secrets.zendeskHostName).toEqual(TEST_ZENDESK_HOSTNAME)
    expect(secrets.zendeskWebhookSecretKey).toEqual(
      TEST_ZENDESK_WEBHOOK_SECRET_KEY
    )
  })

  const keyList: string[] = [
    'ZENDESK_API_KEY',
    'ZENDESK_API_USER_ID',
    'ZENDESK_API_USER_EMAIL',
    'ZENDESK_HOSTNAME',
    'ZENDESK_WEBHOOK_SECRET_KEY'
  ]

  keyList.forEach((keyToOmit) => {
    it(`should throw an error when the secret key ${keyToOmit} is not set`, async () => {
      const secretCollection: { [key: string]: string } = { ...allSecretKeys }

      delete secretCollection[keyToOmit]
      console.log(
        `missing key ${keyToOmit} this is the secret collection`,
        secretCollection
      )
      givenSecretKeysSet(secretCollection)

      expect(retrieveZendeskApiSecrets()).rejects.toThrow(
        `Secret with key ${keyToOmit} not set in zendesk-api-secrets`
      )
    })
  })
})
