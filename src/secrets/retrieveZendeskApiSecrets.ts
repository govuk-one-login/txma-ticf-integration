import { ZendeskApiSecrets } from '../types/zendeskApiSecrets'
import { checkSecretsSet } from './checkSecrets'
import { getEnv } from '../utils/helpers'
import { retrieveSecrets } from './retrieveSecrets'

export const retrieveZendeskApiSecrets =
  async (): Promise<ZendeskApiSecrets> => {
    const secretName = getEnv('ZENDESK_API_SECRETS_NAME')
    console.log(secretName)
    const secrets = await retrieveSecrets(secretName)
    checkSecretsSet(secretName, secrets, [
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
