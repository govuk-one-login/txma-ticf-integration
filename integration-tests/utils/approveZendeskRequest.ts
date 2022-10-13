import axios from 'axios'
import { ticketApprovalData } from '../lib/requestData'

import { authoriseAs } from './zendeskUtils'

import { getEnvVariable } from '../lib/zendeskParameters'

const ticketsEndpoint = '/api/v2/tickets'
const zendeskBaseURL: string = getEnvVariable('ZENDESK_BASE_URL')
const agentUsername: string = getEnvVariable('ZENDESK_AGENT_USERNAME')

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
