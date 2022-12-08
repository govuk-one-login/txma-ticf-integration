import {
  invalidRequestData,
  setCustomFieldValueForRequest,
  validRequestData
} from '../constants/dataCopyRequestData'
import {
  CLOSE_ZENDESK_TICKET_COMMENT,
  ZendeskFormFieldIDs
} from '../../shared-test-code/constants/zendeskParameters'
import {
  assertEventNotPresent,
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { approveZendeskTicket } from '../../shared-test-code/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../../shared-test-code/utils/zendesk/createZendeskTicket'
import { deleteZendeskTicket } from '../../shared-test-code/utils/zendesk/deleteZendeskTicket'
import { getZendeskTicket } from '../../shared-test-code/utils/zendesk/getZendeskTicket'
import { assertZendeskCommentPresent } from '../../shared-test-code/utils/zendesk/zendeskTicketComments'
import { getEnv } from '../../shared-test-code/utils/helpers'
import {
  DATA_SENT_TO_QUEUE_MESSAGE,
  WEBHOOK_INVALID_MESSAGE,
  WEBHOOK_RECEIVED_MESSAGE
} from '../constants/cloudWatchLogMessages'

describe('Invalid requests should not start a data copy', () => {
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
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )

      const isWebhookInvalidMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        WEBHOOK_INVALID_MESSAGE
      )
      expect(isWebhookInvalidMessageInLogs).toBe(true)

      const isDataSentToQueueMessageNotInLogs = assertEventNotPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )
      expect(isDataSentToQueueMessageNotInLogs).toBe(true)

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
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [WEBHOOK_RECEIVED_MESSAGE, 'zendeskId', `${ticketId}\\\\`]
        )

      const isWebhookInvalidMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        WEBHOOK_INVALID_MESSAGE
      )
      expect(isWebhookInvalidMessageInLogs).toBe(true)

      const isDataSentToQueueMessageNotInLogs = assertEventNotPresent(
        initiateDataRequestEvents,
        DATA_SENT_TO_QUEUE_MESSAGE
      )
      expect(isDataSentToQueueMessageNotInLogs).toBe(true)

      const zendeskTicket = await getZendeskTicket(ticketId)
      expect(zendeskTicket.status).toEqual('closed')
      await assertZendeskCommentPresent(ticketId, CLOSE_ZENDESK_TICKET_COMMENT)
    })
  })
})
