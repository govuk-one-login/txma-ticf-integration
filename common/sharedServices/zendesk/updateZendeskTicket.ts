import https from 'node:https'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import {
  makeHttpsRequest,
  base64Encode
} from '../../../common/sharedServices/http/httpsRequestUtils'
import { tryParseJSON } from '../../../common/utils/helpers'
import { logger } from '../logger'

export const updateZendeskTicket = async (
  eventBody: string | null,
  message: string,
  ticketStatus: string | null = null
) => {
  if (!eventBody) {
    logger.error('No Zendesk info available, cannot update ticket', {
      errorCode: 'TICF008'
    })
    return
  }
  const zendeskTicketInfo = tryParseJSON(eventBody)
  if (!zendeskTicketInfo.zendeskId) {
    logger.error('No Zendesk ticket ID present, cannot update ticket', {
      errorCode: 'TICF009'
    })
    return
  }

  await updateZendeskTicketById(
    zendeskTicketInfo.zendeskId,
    message,
    ticketStatus
  )
}

const MANUAL_REQUEST_PREFIX = 'MR'

export const updateZendeskTicketById = async (
  zendeskTicketId: string,
  message: string,
  ticketStatus: string | null = null
) => {
  if (zendeskTicketId.startsWith(MANUAL_REQUEST_PREFIX)) {
    logger.info('Skipping Zendesk ticket update for manual request', {
      zendeskTicketId
    })
    return
  }

  const secrets = await retrieveZendeskApiSecrets()
  const options: https.RequestOptions = {
    method: 'PUT',
    hostname: secrets.zendeskHostName,
    path: `/api/v2/tickets/${zendeskTicketId}`,
    headers: {
      Authorization: base64Encode(
        `${secrets.zendeskApiUserEmail}/token:${secrets.zendeskApiKey}`
      ),
      'Content-Type': 'application/json'
    }
  }
  const postData = {
    ticket: {
      ...(ticketStatus && { status: ticketStatus }),
      comment: {
        body: message,
        author_id: secrets.zendeskApiUserId
      }
    }
  }
  try {
    await makeHttpsRequest(options, postData)
    logger.info('Updated Zendesk ticket', { ticketStatus })
  } catch (error) {
    logger.error('Zendesk ticket update failed', {
      errorCode: 'TICF010',
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined
      }
    })
  }
}
