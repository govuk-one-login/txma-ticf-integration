import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput
} from '@aws-sdk/client-secrets-manager'
import { getEnv } from '../../utils/helpers'

export const retrieveSecrets = async (
  secretId: string
): Promise<{ [key: string]: string }> => {
  const client = new SecretsManagerClient({
    region: getEnv('AWS_REGION')
  })
  const command: GetSecretValueCommandInput = {
    SecretId: secretId
  }
  const data = await client.send(new GetSecretValueCommand(command))
  return JSON.parse(data.SecretString as string)
}
