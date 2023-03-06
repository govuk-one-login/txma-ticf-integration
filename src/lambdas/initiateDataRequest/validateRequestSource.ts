import { APIGatewayProxyEventHeaders } from 'aws-lambda'
import * as crypto from 'crypto'
import { retrieveZendeskApiSecrets } from '../../sharedServices/secrets/retrieveZendeskApiSecrets'

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
  const hmac = crypto.createHmac(
    SIGNING_SECRET_ALGORITHM,
    secrets.zendeskWebhookSecretKey
  )
  const localSignature = hmac.update(headerTimestamp + body).digest('base64')
  return !(
    Buffer.compare(
      Buffer.from(headerSignature),
      Buffer.from(localSignature)
    ) === 0
  )
}
