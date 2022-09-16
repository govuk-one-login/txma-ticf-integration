import axios from 'axios'
import { authoriseAs } from './utils/helpers'

import {
  getEndUsername,
  getAgentUsername,
  getZendeskBaseURL
} from './utils/validateTestParameters'

import { validRequestData, ticketApprovalData } from './utils/requestData'

describe('Submit a PII request with approved ticket data', () => {
  const createRequestEndpoint = '/api/v2/requests.json'
  const ticketsEndpoint = '/api/v2/tickets'
  const zendeskBaseURL: string = getZendeskBaseURL()
  const endUsername: string = getEndUsername()
  const agentUsername: string = getAgentUsername()

  it('Should log an entry in cloud watch if request is valid', async () => {
    const response = await axios({
      url: `${zendeskBaseURL}${createRequestEndpoint}`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${authoriseAs(endUsername)}`,
        'Content-Type': 'application/json'
      },
      data: validRequestData
    })

    console.log(response.request)

    expect(response.status).toBe(201)
    expect(response.data.request.id).toBeGreaterThanOrEqual(1)

    const ticketID = response.data.request.id

    console.log(`TICKET ID: ${ticketID}`)

    // approve and submit ticket (fires webhook)
    const approvalResponse = await axios({
      url: `${zendeskBaseURL}${ticketsEndpoint}/${ticketID}`,
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
  })
})
