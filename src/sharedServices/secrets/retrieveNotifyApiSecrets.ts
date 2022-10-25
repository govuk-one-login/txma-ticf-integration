import { NotifyApiSecrets } from '../../types/notifyApiSecrets'
import { checkSecretsSet } from './checkSecrets'
import { getEnv } from '../../utils/helpers'
import { retrieveSecrets } from './retrieveSecrets'

export const retrieveNotifySecrets = async (): Promise<NotifyApiSecrets> => {
  const secretName = getEnv('NOTIFY_API_SECRETS_ARN')
  const secrets = await retrieveSecrets(secretName)
  checkSecretsSet(secretName, secrets, ['NOTIFY_API_KEY', 'NOTIFY_TEMPLATE_ID'])
  return {
    notifyApiKey: secrets['NOTIFY_API_KEY'],
    notifyTemplateId: secrets['NOTIFY_TEMPLATE_ID']
  }
}
