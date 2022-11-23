import {
  CLOSE_ZENDESK_TICKET_COMMENT,
  DATA_SENT_TO_QUEUE_MESSAGE,
  INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
  WEBHOOK_INVALID_MESSAGE,
  WEBHOOK_RECEIVED_MESSAGE
} from './constants/awsParameters'
import {
  invalidRequestData,
  setCustomFieldValueForRequest,
  validRequestData
} from './constants/requestData/dataCopyRequestData'
import { ZendeskFormFieldIDs } from './constants/zendeskParameters'
import {
  assertEventNotPresent,
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from './utils/aws/cloudWatchGetLogs'
import { approveZendeskTicket } from './utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from './utils/zendesk/createZendeskTicket'
import { deleteZendeskTicket } from './utils/zendesk/deleteZendeskTicket'
import { getZendeskTicket } from './utils/zendesk/getZendeskTicket'
import { assertZendeskCommentPresent } from './utils/zendesk/zendeskTicketComments'

describe('Invalid requests should not start a data copy', () => {
  jest.setTimeout(30000)

  describe('invalid recipient email', () => {
    let ticketId: string

    beforeEach(async () => {
      const ticketData = { ...validRequestData }
      setCustomFieldValueForRequest(
        ticketData,
        ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        'txma-team2-bogus-ticf-analyst-dev@test.gov.uk'
      )
      ticketId = await createZendeskTicket(ticketData)
      await approveZendeskTicket(ticketId)
    })

    afterEach(async () => {
      await deleteZendeskTicket(ticketId)
      console.log(
        'recipient email not in approved list should not start data retrieval process, and should close ticket test ended'
      )
    })

    test('recipient email not in approved list should not start data retrieval process, and should close ticket', async () => {
      console.log(
        'recipient email not in approved list should not start data retrieval process, and should close ticket test started'
      )

      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )

      assertEventPresent(initiateDataRequestEvents, WEBHOOK_INVALID_MESSAGE)
      assertEventNotPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )

      const zendeskTicket = await getZendeskTicket(ticketId)
      expect(zendeskTicket.status).toEqual('closed')
      await assertZendeskCommentPresent(
        ticketId,
        'Recipient email not in valid recipient list'
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
      console.log(
        'invalid data should not start data retrieval process, and should close ticket test ended'
      )
    })

    test('invalid data should not start data retrieval process, and should close ticket', async () => {
      console.log(
        'invalid data should not start data retrieval process, and should close ticket test started'
      )
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )

      assertEventPresent(initiateDataRequestEvents, WEBHOOK_INVALID_MESSAGE)
      assertEventNotPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )

      const zendeskTicket = await getZendeskTicket(ticketId)
      expect(zendeskTicket.status).toEqual('closed')
      await assertZendeskCommentPresent(ticketId, CLOSE_ZENDESK_TICKET_COMMENT)
    })
  })
})
