import { ZendeskApiSecrets } from '../types/zendeskApiSecrets'
import { retrieveSecrets } from './retrieveSecrets'
const SECRET_NAME = 'zendesk-api-secrets'
export const retrieveZendeskApiSecrets =
  async (): Promise<ZendeskApiSecrets> => {
    const secrets = await retrieveSecrets(SECRET_NAME)
    checkSecretsSet(secrets, [
      'ZENDESK_API_KEY',
      'ZENDESK_API_USER_ID',
      'ZENDESK_API_USER_EMAIL',
      'ZENDESK_HOSTNAME',
      'ZENDESK_WEBHOOK_SECRET_KEY'
    ])
    return {
      zendeskApiKey: secrets['ZENDESK_API_KEY'],
      zendeskApiUserId: secrets['ZENDESK_API_USER_ID'],
      zendeskApiUserEmail: secrets['ZENDESK_API_USER_EMAIL'],
      zendeskHostName: secrets['ZENDESK_HOSTNAME'],
      zendeskWebhookSecretKey: secrets['ZENDESK_WEBHOOK_SECRET_KEY']
    }
  }

const checkSecretsSet = (
  secrets: { [key: string]: string },
  secretKeys: string[]
) => {
  secretKeys.forEach((k) => checkSecretSet(secrets, k))
}

const checkSecretSet = (
  secrets: { [key: string]: string },
  secretKey: string
) => {
  if (!secrets[secretKey]) {
    throw new Error(`Secret with key ${secretKey} not set in ${SECRET_NAME}`)
  }
}
