import * as crypto from 'crypto'
import { retrieveZendeskApiSecrets } from './retrieveZendeskApiSecrets'

export const isValidSignature = async (
  headerSignature: string,
  body: string,
  timestamp: string
) => {
  const secrets = await retrieveZendeskApiSecrets()
  const SIGNING_SECRET_ALGORITHM = 'sha256'
  console.log('Creating HMAC')
  const hmac = crypto.createHmac(
    SIGNING_SECRET_ALGORITHM,
    secrets.zendeskWebhookSecretKey
  )
  console.log('Creating local signature')
  const localSignature = hmac.update(timestamp + body).digest('base64')
  console.log('Comparing local signature with header signature')
  return (
    Buffer.compare(
      Buffer.from(headerSignature),
      Buffer.from(localSignature)
    ) === 0
  )
}
