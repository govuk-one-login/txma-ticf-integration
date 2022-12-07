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
  try {
    const data = await client.send(new GetSecretValueCommand(command))
    if (typeof data.SecretString === 'string') {
      return JSON.parse(data.SecretString)
    } else {
      throw new Error(`Secret ${secretId} has no value`)
    }
  } catch (error) {
    throw new Error(`Secret with id ${secretId} not found \n${error}`)
  }
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
