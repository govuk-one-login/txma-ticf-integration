import { SQSEvent } from 'aws-lambda'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { tryParseJSON } from '../../utils/helpers'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
import { notifyCopy } from '../../constants/notifyCopy'
import { loggingCopy } from '../../constants/loggingCopy'

export const handler = async (event: SQSEvent) => {
  console.log(
    'Handling close zendesk ticket SQS event',
    JSON.stringify(event, null, 2)
  )

  const requestDetails = parseRequestDetails(event)

  await closeZendeskTicket(
    requestDetails.zendeskId,
    requestDetails.commentCopyReference
  )
}

const parseRequestDetails = (event: SQSEvent) => {
  if (!event.Records.length) {
    throw Error('No records found in event')
  }

  const eventBody = event.Records[0].body
  if (!eventBody) {
    throw Error(interpolateTemplate('missingEventBody', notifyCopy))
  }

  const requestDetails = tryParseJSON(eventBody)
  if (!requestDetails.zendeskId) {
    throw Error(interpolateTemplate('zendeskTicketIdMissing', notifyCopy))
  }

  return requestDetails
}

const closeZendeskTicket = async (ticketId: string, message: string) => {
  try {
    const ticketStatus = 'closed'
    await updateZendeskTicketById(ticketId, message, ticketStatus)
  } catch (error) {
    console.error(interpolateTemplate('ticketNotUpdated', loggingCopy), error)
  }
}
