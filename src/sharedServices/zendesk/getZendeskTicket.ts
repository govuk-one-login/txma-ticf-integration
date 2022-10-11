import https from 'node:https'
import { retrieveZendeskApiSecrets } from '../secrets/retrieveZendeskApiSecrets'
import {
  isZendeskTicketResult,
  ZendeskTicket
} from '../../types/zendeskTicketResult'
import { base64Encode, makeHttpsRequest } from '../http/httpsRequestUtils'
import { interpolateTemplate } from '../../utils/interpolateTemplate'
import { zendeskCopy } from '../../constants/zendeskCopy'
import { loggingCopy } from '../../constants/loggingCopy'

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
    throw Error(interpolateTemplate('throwNotZendeskTicket', zendeskCopy))
  }

  const ticketInfo = data.ticket
  console.log(
    interpolateTemplate('zendeskTicketIdFound', loggingCopy),
    ticketInfo
  )

  return ticketInfo
}
