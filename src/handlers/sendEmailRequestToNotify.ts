import { APIGatewayProxyEvent } from 'aws-lambda'
import { NotifyClient } from 'notifications-node-client'
import { retrieveNotifySecrets } from '../secrets/retrieveNotifySecrets'
import { updateZendeskTicketById } from '../services/updateZendeskTicket'
import { PersonalisationOptions } from '../types/notify/personalisationOptions'
import { tryParseJSON } from '../utils/helpers'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    console.error('Could not find event body. An email has not been sent')
    return
  }
  const requestDetails: PersonalisationOptions = tryParseJSON(event.body)
  try {
    if (isEventBodyInvalid(requestDetails)) {
      throw Error('Required details were not all present in event body')
    }
    const secrets = await retrieveNotifySecrets()
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

    const zendeskTicketUpdateComment =
      'A link to your results has been sent to you.'
    await closeZendeskTicket(
      requestDetails.zendeskId,
      zendeskTicketUpdateComment
    )
  } catch (error) {
    console.error('There was an error sending a request to Notify: ', error)
    if (requestDetails.zendeskId) {
      const zendeskTicketUpdateComment = 'Your results could not be emailed.'
      await closeZendeskTicket(
        requestDetails.zendeskId,
        zendeskTicketUpdateComment
      )
    } else {
      console.error('Zendesk ticket update failed. No ticket ID present')
    }
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

const closeZendeskTicket = async (ticketId: string, message: string) => {
  const ticketStatus = 'closed'
  await updateZendeskTicketById(ticketId, message, ticketStatus)
}
