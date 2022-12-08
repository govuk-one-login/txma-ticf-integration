import axios, { AxiosPromise } from 'axios'
import { authoriseAs } from './authoriseAs'
import {
  ZendeskFormFieldIDs,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'
import { getEnv } from '../helpers'

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
    url: `https://${getEnv(
      'ZENDESK_HOSTNAME'
    )}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
    method: 'PUT',
    headers: {
      Authorization: authoriseAs(getEnv('ZENDESK_AGENT_EMAIL')),
      'Content-Type': 'application/json'
    },
    data: ticketApprovalData
  })
}

const ticketApprovalData = {
  ticket: {
    tags: ['process_started', 'approved'],
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_STATUS_FIELD_ID,
        value: 'approved'
      }
    ],
    status: 'open',
    fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_STATUS_FIELD_ID,
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
