import {
  assertEventNotPresent,
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { getEnv } from '../../shared-test-code/utils/helpers'
import {
  DATA_SENT_TO_QUEUE_MESSAGE,
  WEBHOOK_INVALID_MESSAGE,
  WEBHOOK_RECEIVED_MESSAGE
} from '../constants/cloudWatchLogMessages'
import { getTicketDetailsForId } from '../../shared-test-code/utils/zendesk/getTicketDetailsForId'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'

describe('Invalid requests should not start a data copy', () => {
  describe('invalid request - invalid recipient email', () => {
    let ticketId: string

    beforeEach(async () => {
      const defaultWebhookRequestData = getTicketDetailsForId(1)
      defaultWebhookRequestData.recipientEmail =
        'txma-team2-bogus-ticf-analyst-dev@test.gov.uk'
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('recipient email not in approved list should not start data retrieval process', async () => {
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
    })
  })

  describe('invalid request - date in the future', () => {
    let ticketId: string

    beforeEach(async () => {
      const defaultWebhookRequestData = getTicketDetailsForId(2)
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('invalid data should not start data retrieval process', async () => {
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
    })
  })
})
