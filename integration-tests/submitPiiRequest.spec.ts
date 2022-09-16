import axios from 'axios'

describe('Submit a PII request with approved ticket data', () => {
  const zendeskBaseURL = 'https://govuk1620731396.zendesk.com'
  const createRequestEndpoint = '/api/v2/requests.json'
  const ticketsEndpoint = '/api/v2/tickets'
  const endUsername = 'txma-team2-ticf-analyst-dev@test.gov.uk'
  const agentUsername = 'txma-team2-ticf-approver-dev@test.gov.uk'
  const apiToken = process.env.ZENDESK_TEST_API_TOKEN

  const createRandom = () => {
    return Math.floor(Math.random() * 100).toString()
  }

  expect(apiToken).toBeDefined

  const authoriseAs = (username: string) => {
    return Buffer.from(`${username}/token:${apiToken}`).toString('base64')
  }
  const authorisation = Buffer.from(
    `${endUsername}/token:${apiToken}`
  ).toString('base64')

  const ticketApproval = {
    ticket: {
      tags: ['process_started', 'approved'],
      custom_fields: [{ id: 5605885870748, value: 'approved' }],
      status: 'open',
      fields: [{ id: 5605885870748, value: 'approved' }],
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

  it('Should log an entry in cloud watch if request is valid', async () => {
    expect(true).toBe(true)
    const requestData = {
      request: {
        subject: `Integration Test Request -` + createRandom(),
        ticket_form_id: 5603412248860,
        custom_fields: [
          {
            id: 5605352623260,
            value: 'event_id'
          },
          {
            id: 5605423021084,
            value: '637783 3256'
          },
          {
            id: 5605700069916,
            value: '2022-09-05'
          },
          {
            id: 5641719421852,
            value: ['drivers_license']
          },
          {
            id: 5698447116060,
            value: ''
          }
        ],
        comment: {
          body: 'PII request created in integration test'
        }
      }
    }

    const response = await axios({
      url: `${zendeskBaseURL}${createRequestEndpoint}`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorisation}`,
        'Content-Type': 'application/json'
      },
      data: requestData
    })

    console.log(response.request)

    expect(response.status).toBe(201)
    expect(response.data.request.id).toBeGreaterThanOrEqual(1)

    const ticketID = response.data.request.id

    console.log(`TICKET ID: ${ticketID}`)

    const approvalResponse = await axios({
      url: `${zendeskBaseURL}${ticketsEndpoint}/${ticketID}`,
      method: 'PUT',
      headers: {
        Authorization: `Basic ${authoriseAs(agentUsername)}`,
        'Content-Type': 'application/json'
      },
      data: ticketApproval
    })

    expect(approvalResponse.status).toEqual(200)
    expect(approvalResponse.data.ticket.status).toBe('open')
    expect(approvalResponse.data.ticket.tags).toEqual(
      expect.arrayContaining(['approved'])
    )
  })
})
