import {
  getMatchingLogEvents,
  extractRequestIDFromEventMessage,
  waitForLogStreamContainingEvent
} from './utils/helpers'

import { createZendeskRequest } from './utils/raiseZendeskRequest'
import { approveZendeskRequest } from './utils/approveZendeskRequest'

describe('Submit a PII request with approved ticket data', () => {
  jest.setTimeout(60000)

  it('Should log a success in cloud watch if Zendesk request is valid', async () => {
    const ticketID = await createZendeskRequest(true)

    await approveZendeskRequest(ticketID)

    // Cloudwatch - Fetch latest log stream containing the ticket details
    const webhookReceivedMessage = 'INFO received Zendesk webhook'
    const eventLogStream = await waitForLogStreamContainingEvent(
      webhookReceivedMessage,
      `"zendeskId`,
      `"${ticketID}`
    )
    const logStreamRequestID = extractRequestIDFromEventMessage(
      eventLogStream.eventMessage
    )

    // filter for ticket's successful validation event in the same log stream
    const validRequestFilterPattern = `"${logStreamRequestID}" Sent data transfer`
    console.log(`VALIDATION FILTER PATTERN: ${validRequestFilterPattern}`)
    const validationEvents = await getMatchingLogEvents(
      validRequestFilterPattern,
      eventLogStream.logStreamName
    )

    expect(validationEvents.length).toEqual(1)
    console.log(`VALIDATION EVENT: ${validationEvents[0].message}`)
    expect.stringContaining('Sent data transfer queue message with id')
  })

  it('Should log an error in cloud watch if zendesk request is not valid', async () => {
    const ticketID = await createZendeskRequest(false)
    await approveZendeskRequest(ticketID)

    // Cloudwatch - Fetch latest log stream containing the ticket details
    const webhookReceivedMessage = 'INFO received Zendesk webhook'
    const eventLogStream = await waitForLogStreamContainingEvent(
      webhookReceivedMessage,
      `"zendeskId`,
      `"${ticketID}`
    )
    const logStreamRequestID = extractRequestIDFromEventMessage(
      eventLogStream.eventMessage
    )

    // filter for ticket's validation error event in the same log stream
    const invalidRequestFilterPattern = `"${logStreamRequestID}" INFO Zendesk request was invalid`
    console.log(`VALIDATION FILTER PATTERN: ${invalidRequestFilterPattern}`)
    const validationEvents = await getMatchingLogEvents(
      invalidRequestFilterPattern,
      eventLogStream.logStreamName
    )

    expect(validationEvents.length).toEqual(1)
    console.log(`VALIDATION EVENT: ${validationEvents[0].message}`)
    expect.stringContaining('Zendesk request was invalid')
  })
})
