import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput
} from '@aws-sdk/client-secrets-manager'

export const retrieveSecretValue = async (secretId: string, region: string) => {
  const client = new SecretsManagerClient({
    region: region
  })
  const command: GetSecretValueCommandInput = {
    SecretId: secretId
  }
  const data = await client.send(new GetSecretValueCommand(command))
  return JSON.parse(data.SecretString as string)
}

export const checkSecretsSet = (
  secretName: string,
  secrets: { [key: string]: string },
  secretKeys: string[]
) => {
  secretKeys.forEach((k) => checkSecretSet(secretName, secrets, k))
}

const checkSecretSet = (
  secretName: string,
  secrets: { [key: string]: string },
  secretKey: string
) => {
  if (!secrets[secretKey]) {
    throw new Error(`Secret with key ${secretKey} not set in ${secretName}`)
  }
}
