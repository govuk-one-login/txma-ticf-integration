// Under test
import { retrieveNotifySecrets } from './retrieveNotifyApiSecrets'
// Dependencies
import { retrieveSecrets } from './retrieveSecrets'
import {
  TEST_NOTIFY_SECRET_ARN,
  ALL_NOTIFY_SECRETS
} from '../../utils/tests/testConstants'

jest.mock('./retrieveSecrets', () => ({
  retrieveSecrets: jest.fn()
}))

const mockRetrieveSecrets = retrieveSecrets as jest.Mock<
  Promise<{ [key: string]: string }>
>
const givenSecretKeysSet = (secrets: { [key: string]: string }) => {
  mockRetrieveSecrets.mockResolvedValue(secrets)
}
const allSecretKeys = {
  NOTIFY_API_KEY: ALL_NOTIFY_SECRETS.notifyApiKey,
  NOTIFY_TEMPLATE_ID: ALL_NOTIFY_SECRETS.notifyTemplateId
}
const givenAllSecretsAvailable = () => {
  givenSecretKeysSet(allSecretKeys)
}

describe('retrieveNotifySecrets', () => {
  it('should return object containing secrets when avaiable', async () => {
    givenAllSecretsAvailable()
    const secrets = await retrieveNotifySecrets()
    expect(secrets.notifyApiKey).toEqual(ALL_NOTIFY_SECRETS.notifyApiKey)
    expect(secrets.notifyTemplateId).toEqual(
      ALL_NOTIFY_SECRETS.notifyTemplateId
    )
    expect(retrieveSecrets).toHaveBeenCalledWith(TEST_NOTIFY_SECRET_ARN)
  })
  it.each(['NOTIFY_API_KEY', 'NOTIFY_TEMPLATE_ID'])(
    `should throw an error when %p is not set`,
    async (keyToOmit) => {
      const secretCollection: { [key: string]: string } = {
        ...allSecretKeys
      }
      delete secretCollection[keyToOmit]
      console.log(secretCollection)
      givenSecretKeysSet(secretCollection)

      expect(retrieveNotifySecrets()).rejects.toThrow(
        `Secret with key ${keyToOmit} not set in ${TEST_NOTIFY_SECRET_ARN}`
      )
    }
  )
})
