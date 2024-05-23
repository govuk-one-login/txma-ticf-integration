import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand
} from '@aws-sdk/client-secrets-manager'
import { getEnv } from '../src/utils/helpers'

const setupDevStackSecrets = async () => {
  const stackName = getStackName()
  if (!stackName) {
    throw new Error('STACK_NAME environment variable not set. Cannot continue')
  }
  console.log(`Setting up test secrets for stack '${stackName}'`)
  const client = new SecretsManagerClient({
    region: getEnv('AWS_REGION')
  })
  await copyZendeskSecretsToStackSecret(client)
  await setNotifySecrets(client)
}

const setNotifySecrets = async (client: SecretsManagerClient) => {
  await client.send(
    new PutSecretValueCommand({
      SecretId: `tests/${getStackName()}/NotifySecrets`,
      SecretString: JSON.stringify({ NOTIFY_API_KEY: 'some_value' })
    })
  )
}

const copyZendeskSecretsToStackSecret = async (
  client: SecretsManagerClient
) => {
  const zendeskSecrets = await client.send(
    new GetSecretValueCommand({ SecretId: 'ZendeskSecrets' })
  )
  const zendeskWebhookSecretKey = JSON.parse(
    zendeskSecrets.SecretString as string
  ).ZENDESK_WEBHOOK_SECRET_KEY

  await client.send(
    new PutSecretValueCommand({
      SecretId: `tests/${getStackName()}/ZendeskSecrets`,
      SecretString: JSON.stringify({
        ZENDESK_API_KEY: 'someValue',
        ZENDESK_RECIPIENT_EMAIL: 'somerecipient@somedomain.gov.uk',
        ZENDESK_HOSTNAME: 'mockserver.transaction.build.account.gov.uk',
        ZENDESK_WEBHOOK_SECRET_KEY: zendeskWebhookSecretKey
      })
    })
  )
}

const getStackName = () => process.env.STACK_NAME

setupDevStackSecrets()
  .then(() => {
    console.log('Setup dev secrets successfully')
  })
  .catch((err) => {
    console.log('Error setting up dev secrets', err)
  })
