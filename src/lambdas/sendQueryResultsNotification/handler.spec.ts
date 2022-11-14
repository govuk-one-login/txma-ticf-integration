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

jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getQueryByAthenaQueryId: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

jest.mock('./sendQueryCompleteQueueMessage', () => ({
  sendQueryCompleteQueueMessage: jest.fn()
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
      jest.spyOn(global.console, 'error')

      const message = `Athena Query ${TEST_ATHENA_QUERY_ID} did not complete with status: ${state}`
      givenDbReturnsData()

      await handler(generateAthenaEventBridgeEvent(state))
      expect(console.error).toHaveBeenCalledWith(Error(message))
      expect(updateZendeskTicketById).toHaveBeenCalledWith(
        dbQueryResult.requestInfo.zendeskId,
        message,
        'closed'
      )
      expect(sendQueryCompleteQueueMessage).not.toHaveBeenCalled()
    }
  )

  it('should log an error if the Athena query state is unrecognised', async () => {
    jest.spyOn(global.console, 'error')

    const unrecognisedQueryState = 'something unrecognised'
    givenDbReturnsData()

    await handler(generateAthenaEventBridgeEvent(unrecognisedQueryState))
    expect(console.error).toHaveBeenCalledWith(
      Error(
        `Function was called with unexpected state: ${unrecognisedQueryState}. Ensure the template is configured correctly`
      )
    )

    expect(sendQueryCompleteQueueMessage).not.toHaveBeenCalled()
  })

  it('should call the relevant function given a successful query state', async () => {
    givenDbReturnsData()

    await handler(generateAthenaEventBridgeEvent('SUCCEEDED'))

    expect(getQueryByAthenaQueryId).toHaveBeenCalledWith(TEST_ATHENA_QUERY_ID)
    expect(sendQueryCompleteQueueMessage).toHaveBeenCalledWith({
      athenaQueryId: TEST_ATHENA_QUERY_ID,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME,
      zendeskTicketId: ZENDESK_TICKET_ID
    })
  })
})
