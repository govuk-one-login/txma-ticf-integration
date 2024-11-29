import {
  GetSecretValueCommand,
  GetSecretValueCommandInput
} from '@aws-sdk/client-secrets-manager'
import { secretsManagerClient } from '../../utils/awsSdkClients'

export const retrieveSecrets = async (
  secretId: string
): Promise<{ [key: string]: string }> => {
  const command: GetSecretValueCommandInput = {
    SecretId: secretId
  }
  const data = await secretsManagerClient.send(
    new GetSecretValueCommand(command)
  )
  return JSON.parse(data.SecretString as string)
}
