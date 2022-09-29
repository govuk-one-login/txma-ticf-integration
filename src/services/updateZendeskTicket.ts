import https from 'node:https'
import { retrieveZendeskApiSecrets } from './retrieveZendeskApiSecrets'
import { makeHttpsRequest, base64Encode } from './httpsRequestUtils'
import { tryParseJSON } from '../utils/helpers'

export const updateZendeskTicket = async (
  eventBody: string | null,
  message: string,
  ticketStatus: string | null = null
) => {
  if (!eventBody) {
    console.error('No Zendesk info available. Cannot update ticket.')
    return
  }
  const zendeskTicketInfo = tryParseJSON(eventBody)
  if (!zendeskTicketInfo.zendeskId) {
    console.error('No Zendesk ticket ID present. Cannot update ticket.')
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
    console.log('Zendesk ticket validation update successful.', data)
  } catch (error) {
    console.error('Zendesk ticket validation update failed.', error)
  }
}
