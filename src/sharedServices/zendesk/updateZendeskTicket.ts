import https from 'node:https'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import { makeHttpsRequest, base64Encode } from './../http/httpsRequestUtils'
import { tryParseJSON } from '../../utils/helpers'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
import { loggingCopy } from '../../constants/loggingCopy'
import { logger } from '../logger'

export const updateZendeskTicket = async (
  eventBody: string | null,
  message: string,
  ticketStatus: string | null = null
) => {
  if (!eventBody) {
    logger.error(interpolateTemplate('zendeskNoInfo', loggingCopy))
    return
  }
  const zendeskTicketInfo = tryParseJSON(eventBody)
  if (!zendeskTicketInfo.zendeskId) {
    logger.error(interpolateTemplate('zendeskNoTicketId', loggingCopy))
    return
  }

  await updateZendeskTicketById(
    zendeskTicketInfo.zendeskId,
    message,
    ticketStatus
  )
}

export const updateZendeskTicketById = async (
  zendeskTicketId: string,
  message: string,
  ticketStatus: string | null = null
) => {
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
    const data = await makeHttpsRequest(options, postData)
    logger.info(
      interpolateTemplate('zendeskSuccessful', loggingCopy),
      JSON.stringify(data)
    )
  } catch (error) {
    logger.error(
      interpolateTemplate('zendeskFailed', loggingCopy),
      error as Error
    )
  }
}
