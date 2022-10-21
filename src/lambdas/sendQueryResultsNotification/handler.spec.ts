import { EventBridgeEvent } from 'aws-lambda'
import { when } from 'jest-when'
import { getQueryByAthenaQueryId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../types/athenaEBEventDetails'
import { TEST_ATHENA_QUERY_ID } from '../../utils/tests/testConstants'
import { handler } from './handler'
import { testDataRequest } from '../../utils/tests/testDataRequest'

jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getQueryByAthenaQueryId: jest.fn()
}))
jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
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
  it.each(['CANCELLED', 'FAILED'])(
    'should throw an error if the Athena query has failed',
    async (state: string) => {
      givenDbReturnsData()
      const message = `Athena Query ${TEST_ATHENA_QUERY_ID} did not complete with status: ${state}`

      await expect(
        handler(generateAthenaEventBridgeEvent(state))
      ).rejects.toThrow(message)
      expect(updateZendeskTicketById).toHaveBeenCalledWith(
        dbQueryResult.requestInfo.zendeskId,
        message,
        'closed'
      )
    }
  )
})
