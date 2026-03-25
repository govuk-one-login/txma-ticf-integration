import { type MockedFunction } from 'vitest'
import { retrieveZendeskApiSecrets } from '../../../sharedServices/secrets/retrieveZendeskApiSecrets'
import { ZendeskApiSecrets } from '../../../types/zendeskApiSecrets'
import { ALL_ZENDESK_SECRETS } from '../testConstants'

const mockRetrieveZendeskApiSecrets =
  retrieveZendeskApiSecrets as MockedFunction<typeof retrieveZendeskApiSecrets>

const givenSecretKeysSet = (secrets: ZendeskApiSecrets) => {
  mockRetrieveZendeskApiSecrets.mockResolvedValue(secrets)
}

export const givenAllSecretsAvailable = () => {
  givenSecretKeysSet(ALL_ZENDESK_SECRETS)
}
