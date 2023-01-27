import { EventBridgeEvent } from 'aws-lambda'
import { when } from 'jest-when'
import { getQueryByAthenaQueryId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../types/athenaEBEventDetails'
import {
  TEST_ATHENA_QUERY_ID,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { handler } from './handler'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { sendQueryCompleteQueueMessage } from './sendQueryCompleteQueueMessage'
import { sendQueryOutputGeneratedAuditMessage } from '../../sharedServices/queue/sendAuditMessage'
import { logger } from '../../sharedServices/logger'
import { mockLambdaContext } from '../../utils/tests/mocks/mockLambdaContext'

jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getQueryByAthenaQueryId: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

jest.mock('./sendQueryCompleteQueueMessage', () => ({
  sendQueryCompleteQueueMessage: jest.fn()
}))

jest.mock('../../sharedServices/queue/sendAuditMessage', () => ({
  sendQueryOutputGeneratedAuditMessage: jest.fn()
}))

describe('sendQueryResultsNotification', () => {
  const dbQueryResult = {
    requestInfo: testDataRequest,
    athenaQueryId: TEST_ATHENA_QUERY_ID
  }

  const givenDbReturnsData = () => {
    when(getQueryByAthenaQueryId).mockResolvedValue(dbQueryResult)
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
    jest.resetAllMocks()
  })

  it.each(['CANCELLED', 'FAILED'])(
    `should log an error if the Athena query state is set to %p`,
    async (state: string) => {
      jest.spyOn(logger, 'error')

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
    jest.spyOn(logger, 'error')

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
      sendQueryCompleteQueueMessage as jest.Mock
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
    expect(sendQueryOutputGeneratedAuditMessage).toHaveBeenCalledBefore(
      mockSendQueryCompleteQueueMessage
    )
  })
})
