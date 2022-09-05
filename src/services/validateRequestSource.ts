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
  console.log('creating local signature')
  const localSignature = hmac.update(timestamp + body).digest('base64')
  console.log('Comparing local signature with header signature')
  return (
    Buffer.compare(
      Buffer.from(headerSignature),
      Buffer.from(localSignature)
    ) === 0
  )
}

// import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
// import { isValidSignature } from '../service/checkWebhookSignature';

// export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
//     console.log('Starting body check');
//     const signature = event.headers['X-Zendesk-Webhook-Signature'] as string;
//     const timestamp = event.headers['X-Zendesk-Webhook-Signature-Timestamp'] as string;

//     if (!isValidSignature(signature, event.body as string, timestamp)) {
//         return {
//             statusCode: 403,
//             body: JSON.stringify({
//                 message: 'invalid signature',
//             })
//         }
//     }
//     var response: APIGatewayProxyResult;
//     try {
//         response = {
//             statusCode: 200,
//             body: JSON.stringify({
//                 message: 'ok',
//             }),
//         };
//     } catch (err) {
//         console.log(err);
//         response = {
//             statusCode: 500,
//             body: JSON.stringify({
//                 message: 'some error happened',
//             }),
//         };
//     }
//     console.log('full event details', JSON.stringify(event));
//     return response;
// };
