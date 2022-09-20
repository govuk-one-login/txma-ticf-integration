import { retrieveZendeskApiSecrets } from '../../../secrets/retrieveZendeskApiSecrets'
import { ZendeskApiSecrets } from '../../../types/zendeskApiSecrets'
import { ALL_SECRET_KEYS } from '../testConstants'

const mockRetrieveZendeskApiSecrets = retrieveZendeskApiSecrets as jest.Mock<
  Promise<ZendeskApiSecrets>
>

const givenSecretKeysSet = (secrets: ZendeskApiSecrets) => {
  mockRetrieveZendeskApiSecrets.mockResolvedValue(secrets)
}

export const givenAllSecretsAvailable = () => {
  givenSecretKeysSet(ALL_SECRET_KEYS)
}
