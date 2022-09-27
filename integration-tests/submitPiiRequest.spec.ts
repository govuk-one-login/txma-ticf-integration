import axios from 'axios'
import { authoriseAs, getLatestLogStreamName } from './utils/helpers'
import { cloudWatchLogsClient } from './libs/cloudWatchLogsClient'
import {
  FilterLogEventsCommand,
  FilterLogEventsCommandInput,
  FilterLogEventsCommandOutput,
  FilteredLogEvent
} from '@aws-sdk/client-cloudwatch-logs'

import {
  getEndUsername,
  getAgentUsername,
  getZendeskBaseURL
} from './utils/validateTestParameters'

import { validRequestData, ticketApprovalData } from './utils/requestData'

describe.only('Submit a PII request with approved ticket data', () => {
  const createRequestEndpoint = '/api/v2/requests.json'
  const ticketsEndpoint = '/api/v2/tickets'
  const zendeskBaseURL: string = getZendeskBaseURL()
  const endUsername: string = getEndUsername()
  const agentUsername: string = getAgentUsername()

  jest.setTimeout(20000)

  it('Should log an entry in cloud watch if request is valid', async () => {
    const axiosResponse = await axios({
      url: `${zendeskBaseURL}${createRequestEndpoint}`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${authoriseAs(endUsername)}`,
        'Content-Type': 'application/json'
      },
      data: validRequestData
    })

    expect(axiosResponse.status).toBe(201)
    expect(axiosResponse.data.request.id).toBeGreaterThanOrEqual(1)

    const ticketID = axiosResponse.data.request.id

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

    // CHECK LOGS IN CLOUDWATCH - Cloudwatch API v3
    // const startTime = Date.now() + 60 * 60 * 1000

    // Fetch latest log stream until the one logged after request
    const filterPattern = 'INFO received Zendesk webhook'
    let latestLogStreamName = ''

    latestLogStreamName = await getLatestLogStreamName()
    console.log(`LATEST LOG STREAM NAME: ${latestLogStreamName}`)

    let eventMatched = false

    while (!eventMatched) {
      const filterLogEventsParams: FilterLogEventsCommandInput = {
        logGroupName:
          '/aws/lambda/ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG',
        logStreamNames: [latestLogStreamName],
        filterPattern: filterPattern
      }

      const filterLogEventsCommand = new FilterLogEventsCommand(
        filterLogEventsParams
      )
      const filterLogEventsResponse: FilterLogEventsCommandOutput =
        await cloudWatchLogsClient.send(filterLogEventsCommand)
      const filterLogEvents: FilteredLogEvent[] | undefined =
        filterLogEventsResponse.events

      expect(filterLogEvents).toBeDefined()
      expect(filterLogEvents?.length).toBeGreaterThanOrEqual(1)

      filterLogEvents!.map((e) => {
        console.log(`EVENT MESSAGE: ${e.message}`)
        if (
          e.message?.includes(`"zendeskId`) &&
          e.message.includes(`${ticketID}`)
        ) {
          console.log('Ticket Event matched')
          eventMatched = true
        } else {
          console.log('Ticket event not found')
          getLatestLogStreamName().then(
            (result) =>
              (latestLogStreamName = result == undefined ? '' : result)
          )
        }
      })
    }
  })
})
