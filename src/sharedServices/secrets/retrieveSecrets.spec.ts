import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueResponse
} from '@aws-sdk/client-secrets-manager'
import { retrieveSecrets } from './retrieveSecrets'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

const GIVEN_SECRET_ID = 'my-secret-key'
const GIVEN_SECRET_KEY = 'MY_SECRET_ITEM'
const GIVEN_SECRET_VALUE = 'secretItemValue'

describe('retrieve secrets', () => {
  const secretsMockClient = mockClient(SecretsManagerClient)
  const secretValueCommandOutput: GetSecretValueResponse = {
    SecretString: `{"${GIVEN_SECRET_KEY}": "${GIVEN_SECRET_VALUE}"}`
  }
  secretsMockClient.on(GetSecretValueCommand).resolves(secretValueCommandOutput)
  it('should retrieve secrets when available', async () => {
    const secrets = await retrieveSecrets(GIVEN_SECRET_ID)
    expect(secrets[GIVEN_SECRET_KEY]).toEqual(GIVEN_SECRET_VALUE)
    expect(secretsMockClient).toHaveReceivedCommandWith(GetSecretValueCommand, {
      SecretId: GIVEN_SECRET_ID
    })
  })
})
