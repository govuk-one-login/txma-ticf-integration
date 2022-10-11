import { APIGatewayProxyEvent } from 'aws-lambda'
import { sendEmailToNotify } from './sendEmailToNotify'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { PersonalisationOptions } from '../../types/notify/personalisationOptions'
import { tryParseJSON } from '../../utils/helpers'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
import { notifyCopy } from '../../constants/notifyCopy'
import { loggingCopy } from '../../constants/loggingCopy'

// event type is a placeholder
export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    throw Error(interpolateTemplate('missingEventBody', notifyCopy))
  }
  const requestDetails: PersonalisationOptions = tryParseJSON(event.body)
  if (!requestDetails.zendeskId) {
    throw Error(interpolateTemplate('zendeskTicketIdMissing', notifyCopy))
  }
  if (isEventBodyInvalid(requestDetails)) {
    await closeZendeskTicket(
      requestDetails.zendeskId,
      interpolateTemplate('resultNotEmailed', notifyCopy)
    )
    throw Error(interpolateTemplate('requiredDetailsMissing', notifyCopy))
  }

  try {
    await sendEmailToNotify(requestDetails)
    await closeZendeskTicket(
      requestDetails.zendeskId,
      interpolateTemplate('linkToResults', notifyCopy)
    )
  } catch (error) {
    console.error(
      interpolateTemplate('requestNotSentToNotify', loggingCopy),
      error
    )
    await closeZendeskTicket(
      requestDetails.zendeskId,
      interpolateTemplate('resultNotEmailed', notifyCopy)
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
    console.error(interpolateTemplate('ticketNotUpdated', loggingCopy), error)
  }
}
