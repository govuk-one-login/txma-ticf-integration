import {
  isZendeskTicketResult,
  ZendeskTicket
} from '../types/zendeskTicketResult'
import { base64Encode, makeHttpsRequest } from './httpsRequestUtils'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import https from 'node:https'

export const getZendeskTicket = async (id: string): Promise<ZendeskTicket> => {
  const secrets = await retrieveZendeskApiSecrets()
  const options: https.RequestOptions = {
    method: 'GET',
    hostname: secrets.zendeskHostName,
    path: `/api/v2/tickets/${id}.json`,
    headers: {
      Authorization: base64Encode(
        `${secrets.zendeskApiUserEmail}/token:${secrets.zendeskApiKey}`
      )
    }
  }

  const data = await makeHttpsRequest(options)

  if (!isZendeskTicketResult(data)) {
    throw Error('The returned data was not a Zendesk ticket')
  }

  const ticketInfo = data.ticket
  console.log('Zendesk ticket with matching id found', ticketInfo)

  return ticketInfo
}
