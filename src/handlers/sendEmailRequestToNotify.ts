import { APIGatewayProxyEvent } from 'aws-lambda'
import NotifyClient from 'notifications-node-client'
import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) return 'No body'
  const requestDetails = JSON.parse(event.body)
  const secrets = await retrieveNotifySecrets()
  const notifyClient = new NotifyClient(secrets.notifyApiKey)
  const response = await Promise.resolve(
    notifyClient.sendEmail(
      secrets.notifyTemplateId,
      // using my email for testing. This is the recipient of the email
      // and will need to come from the event payload
      requestDetails.email,
      {
        personalisation: {
          firstName: 'Mabon',
          zendeskId: '123',
          signedUrl: 'signedurl.com',
          reference: ''
        }
      }
    )
  )
  console.log(response)
  return response
}
// need to add options.personalisation to  enter text into the email.
// need to grab recipient email address from event body
// needs logging
