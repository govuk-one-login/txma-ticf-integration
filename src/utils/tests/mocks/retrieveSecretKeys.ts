import { retrieveZendeskApiSecrets } from '../../../secrets/retrieveZendeskApiSecrets'
import { ZendeskApiSecrets } from '../../../types/zendeskApiSecrets'
import { ALL_ZENDESK_SECRETS } from '../testConstants'

const mockRetrieveZendeskApiSecrets = retrieveZendeskApiSecrets as jest.Mock<
  Promise<ZendeskApiSecrets>
>

const givenSecretKeysSet = (secrets: ZendeskApiSecrets) => {
  mockRetrieveZendeskApiSecrets.mockResolvedValue(secrets)
}

export const givenAllSecretsAvailable = () => {
  givenSecretKeysSet(ALL_ZENDESK_SECRETS)
}
