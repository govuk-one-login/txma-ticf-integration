import { APIGatewayProxyEvent } from 'aws-lambda'
import { sendEmailToNotify } from '../services/sendEmailRequestToNotify'
import { updateZendeskTicketById } from '../services/updateZendeskTicket'
import { PersonalisationOptions } from '../types/notify/personalisationOptions'
import { tryParseJSON } from '../utils/helpers'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    throw Error('Could not find event body. An email has not been sent')
  }
  const requestDetails: PersonalisationOptions = tryParseJSON(event.body)
  if (!requestDetails.zendeskId) {
    throw Error('Zendesk ticket ID missing from event body')
  }

  let zendeskTicketUpdateComment: string
  try {
    if (isEventBodyInvalid(requestDetails)) {
      throw Error('Required details were not all present in event body')
    }
    await sendEmailToNotify(requestDetails)
    zendeskTicketUpdateComment = 'A link to your results has been sent to you.'
  } catch (error) {
    console.error('There was an error sending a request to Notify: ', error)
    zendeskTicketUpdateComment = 'Your results could not be emailed.'
  }

  await closeZendeskTicket(requestDetails.zendeskId, zendeskTicketUpdateComment)
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
  try {
    const ticketStatus = 'closed'
    await updateZendeskTicketById(ticketId, message, ticketStatus)
  } catch (error) {
    console.error(error)
  }
}
