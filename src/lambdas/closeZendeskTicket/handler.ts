import { Context, SQSEvent } from 'aws-lambda'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { tryParseJSON } from '../../../common/utils/helpers'
import { interpolateTemplate } from '../../../common/utils/interpolateTemplate'
import { zendeskCopy } from '../../../common/constants/zendeskCopy'
import { loggingCopy } from '../../../common/constants/loggingCopy'
import {
  appendZendeskIdToLogger,
  initialiseLogger,
  logger
} from '../../../common/sharedServices/logger'

export const handler = async (event: SQSEvent, context: Context) => {
  initialiseLogger(context)

  const requestDetails = parseRequestDetails(event)
  appendZendeskIdToLogger(requestDetails.zendeskId)

  await closeZendeskTicket(
    requestDetails.zendeskId,
    requestDetails.commentCopyText
  )
}

const parseRequestDetails = (event: SQSEvent) => {
  if (!event.Records.length) {
    throw Error('No records found in event')
  }

  const eventBody = event.Records[0].body
  if (!eventBody) {
    throw Error(interpolateTemplate('missingEventBody', zendeskCopy))
  }

  const requestDetails = tryParseJSON(eventBody)
  if (!requestDetails.zendeskId) {
    throw Error(interpolateTemplate('zendeskTicketIdMissing', zendeskCopy))
  }
  if (!requestDetails.commentCopyText) {
    throw Error(interpolateTemplate('commentCopyTextMissing', zendeskCopy))
  }

  return requestDetails
}

const closeZendeskTicket = async (ticketId: string, message: string) => {
  try {
    const ticketStatus = 'closed'
    await updateZendeskTicketById(ticketId, message, ticketStatus)
  } catch (error) {
    logger.error(
      interpolateTemplate('ticketNotUpdated', loggingCopy),
      error as Error
    )
  }
}
