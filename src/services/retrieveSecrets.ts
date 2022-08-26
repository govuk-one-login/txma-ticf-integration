import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandInput
} from '@aws-sdk/client-secrets-manager'
const region = process.env.AWS_REGION
export const retrieveSecrets = async (
  secretName: string
): Promise<{ [key: string]: string }> => {
  const client = new SecretsManagerClient({
    region: region
  })
  const command: GetSecretValueCommandInput = {
    SecretId: secretName
  }
  const data = await client.send(new GetSecretValueCommand(command))
  return JSON.parse(data.SecretString as string)
}
