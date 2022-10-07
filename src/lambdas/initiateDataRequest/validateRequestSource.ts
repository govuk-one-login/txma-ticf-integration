import { APIGatewayProxyEventHeaders } from 'aws-lambda'
import * as crypto from 'crypto'
import { retrieveZendeskApiSecrets } from '../../secrets/retrieveZendeskApiSecrets'

export const isSignatureInvalid = async (
  headers: APIGatewayProxyEventHeaders | undefined,
  body: string | null
) => {
  if (!headers) return true

  const headerSignature = headers['X-Zendesk-Webhook-Signature']
  const headerTimestamp = headers['X-Zendesk-Webhook-Signature-Timestamp']
  if (!(headerSignature && body && headerTimestamp)) return true

  const secrets = await retrieveZendeskApiSecrets()
  const SIGNING_SECRET_ALGORITHM = 'sha256'
  console.log('Creating HMAC')
  const hmac = crypto.createHmac(
    SIGNING_SECRET_ALGORITHM,
    secrets.zendeskWebhookSecretKey
  )
  console.log('Creating local signature')
  const localSignature = hmac.update(headerTimestamp + body).digest('base64')
  console.log('Comparing local signature with header signature')
  return !(
    Buffer.compare(
      Buffer.from(headerSignature),
      Buffer.from(localSignature)
    ) === 0
  )
}
