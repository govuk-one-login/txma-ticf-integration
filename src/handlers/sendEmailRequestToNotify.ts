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
  if (isEventBodyInvalid(requestDetails)) {
    await closeZendeskTicket(
      requestDetails.zendeskId,
      'Your results could not be emailed.'
    )
    throw Error('Required details were not all present in event body')
  }

  try {
    await sendEmailToNotify(requestDetails)
    await closeZendeskTicket(
      requestDetails.zendeskId,
      'A link to your results has been sent to you.'
    )
  } catch (error) {
    console.error('Could not send a request to Notify: ', error)
    await closeZendeskTicket(
      requestDetails.zendeskId,
      'Your results could not be emailed.'
    )
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
  try {
    const ticketStatus = 'closed'
    await updateZendeskTicketById(ticketId, message, ticketStatus)
  } catch (error) {
    console.error('Could not update Zendesk ticket: ', error)
  }
}
