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
describe('retrieveZendeskApiSecrets', () => {
  const givenSecretKeysSet = (secrets: { [key: string]: string }) => {
    mockRetrieveSecrets.mockResolvedValue(secrets)
  }

  const givenAllSecretsAvailable = () => {
    givenSecretKeysSet({
      ZENDESK_API_KEY: TEST_ZENDESK_API_KEY,
      ZENDESK_API_USER_ID: TEST_ZENDESK_API_USER_ID,
      ZENDESK_API_USER_EMAIL: TEST_ZENDESK_API_USER_EMAIL
    })
  }

  it('should return object containing secrets when available', async () => {
    givenAllSecretsAvailable()
    const secrets = await retrieveZendeskApiSecrets()
    expect(secrets.zendeskApiKey).toEqual(TEST_ZENDESK_API_KEY)
    expect(secrets.zendeskApiUserEmail).toEqual(TEST_ZENDESK_API_USER_EMAIL)
    expect(secrets.zendeskApiUserId).toEqual(TEST_ZENDESK_API_USER_ID)
  })

  it('should throw an error when one of the secret keys is not set', async () => {
    givenSecretKeysSet({
      ZENDESK_API_KEY: TEST_ZENDESK_API_KEY,
      ZENDESK_API_USER_ID: TEST_ZENDESK_API_USER_ID
    })
    expect(retrieveZendeskApiSecrets()).rejects.toThrow(
      `Secret with key ZENDESK_API_USER_EMAIL not set in zendesk-api-secrets`
    )
  })
})
