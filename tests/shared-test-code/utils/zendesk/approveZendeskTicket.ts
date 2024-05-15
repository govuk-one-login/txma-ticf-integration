import axios, { AxiosPromise } from 'axios'
import { authoriseAs } from './authoriseAs'
import { getEnv } from '../helpers'
import { zendeskConstants } from '../../constants/zendeskParameters'

export const approveZendeskTicket = async (ticketId: string) => {
  try {
    const response = await makeApproveZendeskTicketRequest(ticketId)
    expect(response.data.ticket.status).toEqual('open')
    expect(response.data.ticket.tags).toEqual(
      expect.arrayContaining(['approved'])
    )
  } catch (error) {
    console.log(`approving zendesk ticket failed. id: '${ticketId}'`)
    if (axios.isAxiosError(error)) {
      const data = {
        response: error.response,
        to_json: error.toJSON()
      }
      console.log(data)
    } else {
      console.log(error)
    }
    throw 'Error approving Zendesk ticket'
  }
}

export const makeApproveZendeskTicketRequest = (
  ticketId: string
): AxiosPromise => {
  return axios({
    url: `https://${getEnv('ZENDESK_HOSTNAME')}/api/v2/tickets/${ticketId}`,
    method: 'PUT',
    headers: {
      Authorization: authoriseAs(getEnv('ZENDESK_AGENT_EMAIL')),
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(ticketApprovalData)
  })
}

const ticketApprovalData = {
  ticket: {
    tags: ['process_started', 'approved'],
    custom_fields: [
      {
        id: zendeskConstants.fieldIds.status,
        value: 'approved'
      }
    ],
    status: 'open',
    fields: [
      {
        id: zendeskConstants.fieldIds.status,
        value: 'approved'
      }
    ],
    collaborator_ids: [],
    follower_ids: [],
    comment: {
      body: '<p>Request <b>APPROVED</b> and data retrieval has started...</p>',
      html_body:
        '<p>Request <b>APPROVED</b> and data retrieval has started...</p>',
      public: 'true'
    }
  }
}
