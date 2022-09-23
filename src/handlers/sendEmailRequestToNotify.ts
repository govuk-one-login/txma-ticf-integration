import { APIGatewayProxyEvent } from 'aws-lambda'
import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { PersonalisationOptions } from '../types/notify/personalisationOptions'
import { tryParseJSON } from '../utils/helpers'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    console.error('Could not find event body. An email has not been sent')
    return
  }
  try {
    const requestDetails: PersonalisationOptions = tryParseJSON(event.body)
    const secrets = await retrieveNotifySecrets()
    if (isEventBodyInvalid(requestDetails)) {
      throw Error('Required details were not all present in event body')
    }
    const notifyClient = new NotifyClient(secrets.notifyApiKey)

    console.log('Sending request to Notify')
    const response = await Promise.resolve(
      notifyClient.sendEmail(secrets.notifyTemplateId, requestDetails.email, {
        personalisation: {
          firstName: requestDetails.firstName,
          zendeskId: requestDetails.zendeskId,
          signedUrl: requestDetails.signedUrl
        }
      })
    )

    const logObject = {
      status: response.status,
      emailSentTo: requestDetails.email,
      subjectLine: response.data.content.subject
    }

    console.log(logObject)
  } catch (error) {
    console.error('There was an error sending a request to Notify: ', error)
    return
  }
}

const isEventBodyInvalid = (requestDetails: PersonalisationOptions) => {
  return !(
    requestDetails.firstName &&
    requestDetails.zendeskId &&
    requestDetails.signedUrl &&
    requestDetails.email
  )
}
