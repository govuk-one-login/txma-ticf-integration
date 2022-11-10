import axios, { AxiosPromise } from 'axios'
import { authoriseAs } from './authoriseAs'
import { ticketApprovalData } from '../../constants/requestData/dataCopyRequestData'
import {
  ZENDESK_AGENT_EMAIL,
  ZENDESK_BASE_URL,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'

export const approveZendeskTicket = async (ticketId: string) => {
  try {
    const response = await makeApproveZendeskTicketRequest(ticketId)
    expect(response.data.ticket.status).toEqual('open')
    expect(response.data.ticket.tags).toEqual(
      expect.arrayContaining(['approved'])
    )
  } catch (error) {
    console.log(error)
    throw 'Error approving Zendesk ticket'
  }
}

export const makeApproveZendeskTicketRequest = (
  ticketId: string
): AxiosPromise => {
  return axios({
    url: `${ZENDESK_BASE_URL}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
    method: 'PUT',
    headers: {
      Authorization: authoriseAs(ZENDESK_AGENT_EMAIL),
      'Content-Type': 'application/json'
    },
    data: ticketApprovalData
  })
}
