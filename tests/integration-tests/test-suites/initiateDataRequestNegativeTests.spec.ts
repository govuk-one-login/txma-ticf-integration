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

import { zendeskConstants } from '../../shared-test-code/constants/zendeskParameters'
import { setCustomFieldValueForRequest } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { requestConstants } from '../constants/requests'

const closeTicketComment =
  'Your ticket has been closed because some fields were invalid. ' +
  'Here is the list of what was wrong: From Date is in the future, To Date is in the future'

describe('Invalid requests should not start a data copy', () => {
  describe('invalid recipient email', () => {
    let ticketId: string

    beforeEach(async () => {
      const ticketData = { ...requestConstants.valid }

      setCustomFieldValueForRequest(
        ticketData,
        zendeskConstants.fieldIds.recipientEmail,
        'invalid@test.gov.uk'
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
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )

      assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.webhookInvalid
      )
      assertEventNotPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
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
      ticketId = await createZendeskTicket(requestConstants.invalid)
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
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )

      assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.webhookInvalid
      )
      assertEventNotPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )

      const zendeskTicket = await getZendeskTicket(ticketId)
      expect(zendeskTicket.status).toEqual('closed')
      await assertZendeskCommentPresent(ticketId, closeTicketComment)
    })
  })
})
