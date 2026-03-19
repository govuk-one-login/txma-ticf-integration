import { vi, type MockedFunction } from 'vitest'
import { EventBridgeEvent } from 'aws-lambda'
import { getQueryByAthenaQueryId } from '../../../common/sharedServices/dynamoDB/dynamoDBGet'
import { updateZendeskTicketById } from '../../../common/sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../../common/types/athenaEBEventDetails'
import {
  TEST_ATHENA_QUERY_ID,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  ZENDESK_TICKET_ID
} from '../../../common/utils/tests/testConstants'
import { handler } from './handler'
import { testDataRequest } from '../../../common/utils/tests/testDataRequest'
import { sendQueryCompleteQueueMessage } from './sendQueryCompleteQueueMessage'
import { sendQueryOutputGeneratedAuditMessage } from '../../../common/sharedServices/queue/sendAuditMessage'
import { logger } from '../../../common/sharedServices/logger'
import { mockLambdaContext } from '../../../common/utils/tests/mocks/mockLambdaContext'

vi.mock('../../../common/sharedServices/dynamoDB/dynamoDBGet', () => ({
  getQueryByAthenaQueryId: vi.fn()
}))

vi.mock('../../../common/sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: vi.fn()
}))

vi.mock('./sendQueryCompleteQueueMessage', () => ({
  sendQueryCompleteQueueMessage: vi.fn()
}))

vi.mock('../../../common/sharedServices/queue/sendAuditMessage', () => ({
  sendQueryOutputGeneratedAuditMessage: vi.fn()
}))

describe('sendQueryResultsNotification', () => {
  const dbQueryResult = {
    requestInfo: testDataRequest,
    athenaQueryId: TEST_ATHENA_QUERY_ID
  }

  const givenDbReturnsData = () => {
    vi.mocked(getQueryByAthenaQueryId).mockResolvedValue(dbQueryResult)
  }

  const generateAthenaEventBridgeEvent = (
    state: string
  ): EventBridgeEvent<'Athena Query State Change', AthenaEBEventDetails> => {
    const eventDetail = {
      currentState: state,
      queryExecutionId: TEST_ATHENA_QUERY_ID
    }
    return {
      id: '123',
      version: '1',
      account: 'aws',
      time: '12:00',
      region: 'eu-west-2',
      resources: [],
      source: 'aws.athena',
      'detail-type': 'Athena Query State Change',
      detail: {
        ...eventDetail
      }
    }
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it.each(['CANCELLED', 'FAILED'])(
    `should log an error if the Athena query state is set to %p`,
    async (state: string) => {
      vi.spyOn(logger, 'error')

      const message = `Athena Query ${TEST_ATHENA_QUERY_ID} did not complete with status: ${state}`
      givenDbReturnsData()

      await handler(generateAthenaEventBridgeEvent(state), mockLambdaContext)
      expect(logger.error).toHaveBeenCalledWith(
        'failed to confirm query state',
        Error(message)
      )
      expect(updateZendeskTicketById).toHaveBeenCalledWith(
        dbQueryResult.requestInfo.zendeskId,
        message,
        'closed'
      )
      expect(sendQueryCompleteQueueMessage).not.toHaveBeenCalled()
    }
  )

  it('should log an error if the Athena query state is unrecognised', async () => {
    vi.spyOn(logger, 'error')

    const unrecognisedQueryState = 'something unrecognised'
    givenDbReturnsData()

    await handler(
      generateAthenaEventBridgeEvent(unrecognisedQueryState),
      mockLambdaContext
    )
    expect(logger.error).toHaveBeenCalledWith(
      'failed to confirm query state',
      Error(
        `Function was called with unexpected state: ${unrecognisedQueryState}. Ensure the template is configured correctly`
      )
    )

    expect(sendQueryCompleteQueueMessage).not.toHaveBeenCalled()
  })

  it('should call the relevant functions given a successful query state', async () => {
    const mockSendQueryCompleteQueueMessage =
      sendQueryCompleteQueueMessage as MockedFunction<
        typeof sendQueryCompleteQueueMessage
      >
    givenDbReturnsData()

    await handler(
      generateAthenaEventBridgeEvent('SUCCEEDED'),
      mockLambdaContext
    )

    expect(getQueryByAthenaQueryId).toHaveBeenCalledWith(TEST_ATHENA_QUERY_ID)
    expect(sendQueryCompleteQueueMessage).toHaveBeenCalledWith({
      athenaQueryId: TEST_ATHENA_QUERY_ID,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME,
      zendeskTicketId: ZENDESK_TICKET_ID
    })
    expect(sendQueryOutputGeneratedAuditMessage).toHaveBeenCalledWith(
      ZENDESK_TICKET_ID
    )
    expect(mockSendQueryCompleteQueueMessage).toHaveBeenCalledTimes(1)
  })
})
