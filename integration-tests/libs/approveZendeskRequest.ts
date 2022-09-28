import axios from 'axios'
import { ticketApprovalData } from '../utils/requestData'

import { authoriseAs } from '../utils/helpers'

import {
  getAgentUsername,
  getZendeskBaseURL
} from '../utils/validateTestParameters'

const ticketsEndpoint = '/api/v2/tickets'
const zendeskBaseURL: string = getZendeskBaseURL()
const agentUsername: string = getAgentUsername()

const approveZendeskRequest = async (ticketId: string) => {
  // approve and submit ticket (fires webhook)
  const approvalResponse = await axios({
    url: `${zendeskBaseURL}${ticketsEndpoint}/${ticketId}`,
    method: 'PUT',
    headers: {
      Authorization: `Basic ${authoriseAs(agentUsername)}`,
      'Content-Type': 'application/json'
    },
    data: ticketApprovalData
  })

  expect(approvalResponse.status).toEqual(200)
  expect(approvalResponse.data.ticket.status).toBe('open')
  expect(approvalResponse.data.ticket.tags).toEqual(
    expect.arrayContaining(['approved'])
  )
}

export { approveZendeskRequest }
