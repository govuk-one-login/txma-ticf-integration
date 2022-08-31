import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput
} from '@aws-sdk/client-secrets-manager'
import { REGION } from '../utils/constants'

export const retrieveSecrets = async (
  secretName: string
): Promise<{ [key: string]: string }> => {
  const client = new SecretsManagerClient({
    region: REGION
  })
  const command: GetSecretValueCommandInput = {
    SecretId: secretName
  }
  const data = await client.send(new GetSecretValueCommand(command))
  return JSON.parse(data.SecretString as string)
}
