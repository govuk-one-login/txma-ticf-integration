import {
  getLatestLogStreamName,
  getMatchingLogEvents,
  extractRequestID
} from './utils/helpers'
import { FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs'

import { createZendeskRequest } from './utils/raiseZendeskRequest'
import { approveZendeskRequest } from './utils/approveZendeskRequest'

describe.only('Submit a PII request with approved ticket data', () => {
  jest.setTimeout(30000)

  it('Should log an entry in cloud watch if request is valid', async () => {
    const ticketID = await createZendeskRequest()

    await approveZendeskRequest(ticketID)

    // Cloudwatch - Fetch latest log stream containing the ticket details
    let latestLogStreamName = await getLatestLogStreamName()
    console.log(`LATEST LOG STREAM NAME: ${latestLogStreamName}`)
    let logStreamRequestID
    let eventMatched = false

    while (!eventMatched) {
      const logEvents = await getMatchingLogEvents(
        'INFO received Zendesk webhook',
        latestLogStreamName
      )
      if (logEvents.length == 0) {
        latestLogStreamName = await getLatestLogStreamName()
        continue
      }
      const matchingEvent = logEvents.filter((event) => {
        return (
          event.message?.includes(`"zendeskId`) &&
          event.message.includes(`"${ticketID}`)
        )
      })
      if (matchingEvent.length == 1) {
        console.log(
          `Event for ticket ${ticketID} found in log stream: ${latestLogStreamName}`
        )
        const message: string = matchingEvent[0].message as string
        console.log(`MATCHED EVENT: ${message}`)
        logStreamRequestID = extractRequestID(message)
        eventMatched = true
      } else {
        console.log('Ticket event not found in current stream')
        latestLogStreamName = await getLatestLogStreamName()
      }
    }

    // filter for ticket's successful validation event in the same log stream
    const validRequestFilterPattern = `"${logStreamRequestID}" transfer`
    console.log(`VALIDATION FILTER PATTERN: ${validRequestFilterPattern}`)
    let validationEvents: FilteredLogEvent[] = []
    validationEvents = await getMatchingLogEvents(
      validRequestFilterPattern,
      latestLogStreamName
    )

    expect(validationEvents.length).toEqual(1)
    console.log(`VALIDATION EVENT: ${validationEvents[0].message}`)
  })
})
