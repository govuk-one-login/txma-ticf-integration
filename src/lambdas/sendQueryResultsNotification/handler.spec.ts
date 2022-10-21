import { EventBridgeEvent } from 'aws-lambda'
import { when } from 'jest-when'
import { getQueryByAthenaQueryId } from '../../sharedServices/dynamoDB/dynamoDBGet'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { AthenaEBEventDetails } from '../../types/athenaEBEventDetails'
import {
  TEST_ATHENA_QUERY_ID,
  TEST_DOWNLOAD_HASH,
  TEST_RECIPIENT_EMAIL,
  TEST_RECIPIENT_NAME,
  ZENDESK_TICKET_ID
} from '../../utils/tests/testConstants'
import { handler } from './handler'
import { testDataRequest } from '../../utils/tests/testDataRequest'
import { generateSecureDownloadHash } from './generateSecureDownloadHash'
import { writeOutSecureDownloadRecord } from './writeOutSecureDownloadRecord'
import { queueSendResultsReadyEmail } from './queueSendResultsReadyEmail'

jest.mock('../../sharedServices/dynamoDB/dynamoDBGet', () => ({
  getQueryByAthenaQueryId: jest.fn()
}))

jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
  updateZendeskTicketById: jest.fn()
}))

jest.mock('./generateSecureDownloadHash', () => ({
  generateSecureDownloadHash: jest.fn()
}))

jest.mock('./writeOutSecureDownloadRecord', () => ({
  writeOutSecureDownloadRecord: jest.fn()
}))

jest.mock('./queueSendResultsReadyEmail', () => ({
  queueSendResultsReadyEmail: jest.fn()
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
    `should throw an error if the Athena query state is set to %p`,
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
      expect(generateSecureDownloadHash).not.toHaveBeenCalled()
    }
  )

  it.each(['QUEUED', 'RUNNING'])(
    `should throw an error if the Athena query state is %p`,
    async (state: string) => {
      givenDbReturnsData()

      await expect(
        handler(generateAthenaEventBridgeEvent(state))
      ).rejects.toThrow(
        `Function was called with unexpected state: ${state}. Ensure the template is configured correctly`
      )
      expect(generateSecureDownloadHash).not.toHaveBeenCalled()
    }
  )

  it('should throw an error if the Athena query state is unrecognised', async () => {
    const unrecognisedQueryState = 'something unrecognised'
    givenDbReturnsData()

    await expect(
      handler(generateAthenaEventBridgeEvent(unrecognisedQueryState))
    ).rejects.toThrow(
      `Function was called with unexpected state: ${unrecognisedQueryState}. Ensure the template is configured correctly`
    )
    expect(generateSecureDownloadHash).not.toHaveBeenCalled()
  })

  it('should call the relevant function given a successful query state', async () => {
    givenDbReturnsData()
    when(generateSecureDownloadHash).mockReturnValue(TEST_DOWNLOAD_HASH)

    await handler(generateAthenaEventBridgeEvent('SUCCEEDED'))

    expect(getQueryByAthenaQueryId).toHaveBeenCalledWith(TEST_ATHENA_QUERY_ID)
    expect(generateSecureDownloadHash).toHaveBeenCalled()
    expect(writeOutSecureDownloadRecord).toHaveBeenCalledWith(
      TEST_ATHENA_QUERY_ID,
      TEST_DOWNLOAD_HASH,
      ZENDESK_TICKET_ID
    )
    expect(queueSendResultsReadyEmail).toHaveBeenCalledWith({
      downloadHash: TEST_DOWNLOAD_HASH,
      recipientEmail: TEST_RECIPIENT_EMAIL,
      recipientName: TEST_RECIPIENT_NAME,
      zendeskTicketId: ZENDESK_TICKET_ID
    })
  })
})
