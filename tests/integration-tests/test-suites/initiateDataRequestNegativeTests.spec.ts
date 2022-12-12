import {
  assertEventNotPresent,
  assertEventPresent,
  getCloudWatchLogEventsGroupByMessagePattern
} from '../../shared-test-code/utils/aws/cloudWatchGetLogs'
import { getEnv } from '../../shared-test-code/utils/helpers'

import { cloudwatchLogFilters } from '../constants/cloudWatchLogfilters'
import { getWebhookRequestDataForTestCaseNumberAndDate } from '../../shared-test-code/utils/zendesk/getTicketDetailsForId'
import { sendWebhookRequest } from '../../shared-test-code/utils/zendesk/sendWebhookRequest'

describe('Invalid requests should not start a data copy', () => {
  describe('invalid request - invalid recipient email', () => {
    let ticketId: string

    beforeEach(async () => {
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(1, '2022-01-01')
      defaultWebhookRequestData.recipientEmail =
        'txma-team2-bogus-ticf-analyst-dev@test.gov.uk'
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('recipient email not in approved list should not start data retrieval process', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )

      const isWebhookInvalidMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.webhookInvalid
      )
      expect(isWebhookInvalidMessageInLogs).toBe(true)

      const isDataSentToQueueMessageNotInLogs = assertEventNotPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )
      expect(isDataSentToQueueMessageNotInLogs).toBe(true)
    })
  })

  describe('invalid request - date in the future', () => {
    let ticketId: string
    const getTomorrowAsString = () => {
      const today: Date = new Date()
      today.setDate(today.getDate() + 1)
      return `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
    }

    beforeEach(async () => {
      const defaultWebhookRequestData =
        getWebhookRequestDataForTestCaseNumberAndDate(2, getTomorrowAsString())
      ticketId = defaultWebhookRequestData.zendeskId
      await sendWebhookRequest(defaultWebhookRequestData)
    })

    it('invalid data should not start data retrieval process', async () => {
      const initiateDataRequestEvents =
        await getCloudWatchLogEventsGroupByMessagePattern(
          getEnv('INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP_NAME'),
          [cloudwatchLogFilters.webhookReceived, 'zendeskId', `${ticketId}\\\\`]
        )

      const isWebhookInvalidMessageInLogs = assertEventPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.webhookInvalid
      )
      expect(isWebhookInvalidMessageInLogs).toBe(true)

      const isDataSentToQueueMessageNotInLogs = assertEventNotPresent(
        initiateDataRequestEvents,
        cloudwatchLogFilters.dataSentToQueue
      )
      expect(isDataSentToQueueMessageNotInLogs).toBe(true)
    })
  })
})
