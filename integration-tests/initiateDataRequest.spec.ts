import { getCloudWatchLogEventsGroupByMessagePattern } from './utils/aws/cloudWatchGetLogs'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import { invalidRequestData, validRequestData } from './constants/requestData'
import { INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP } from './constants/awsParameters'
import { FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs'

const assertLogPresent = (logEvents: FilteredLogEvent[], message: string) => {
  const event = logEvents.find((event) => event.message?.includes(message))
  const eventFound = event ? true : false
  expect(eventFound).toEqual(true)
}

describe('Submit a PII request with approved ticket data', () => {
  jest.setTimeout(60000)

  describe('valid requests', () => {
    let ticketId: string

    beforeEach(async () => {
      ticketId = await createZendeskTicket(validRequestData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    it('Should log a success in cloud watch if Zendesk request is valid', async () => {
      const logStreamEvents = await getCloudWatchLogEventsGroupByMessagePattern(
        INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
        'received Zendesk webhook',
        'zendeskId',
        ticketId
      )

      assertLogPresent(
        logStreamEvents,
        'Sent data transfer queue message with id'
      )
    })
  })

  describe('invalid requests', () => {
    let ticketId: string

    beforeEach(async () => {
      ticketId = await createZendeskTicket(invalidRequestData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
    })

    it('Should log an error in cloud watch if zendesk request is not valid', async () => {
      const logStreamEvents = await getCloudWatchLogEventsGroupByMessagePattern(
        INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
        'received Zendesk webhook',
        'zendeskId',
        ticketId
      )
      assertLogPresent(logStreamEvents, 'Zendesk request was invalid')
    })
  })
})
